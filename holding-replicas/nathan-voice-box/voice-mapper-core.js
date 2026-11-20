/* Nathan AI Voice Mapper · deterministic local acoustic measurements.
 * No web APIs, network, speaker recognition, health or emotional inference.
 * UMD exports for native test runner, browser worker, and future mobile ports.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NathanVoiceMapper = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const TARGET_RATE = 16000;
  const FFT_SIZE = 1024;
  const GATES = [0, 70, 140, 240, 400, 600, 900, 1300, 1850, 2700, 4000, 6000, 8000];

  function resample(pcm, sampleRate, target = TARGET_RATE) {
    if (!(pcm instanceof Float32Array) || !Number.isFinite(sampleRate) ||
        sampleRate < 8000 || sampleRate > 192000) throw Error("Invalid PCM or sample rate");
    if (pcm.length > sampleRate * 65) throw Error("Recording must not exceed 65 seconds");
    if (sampleRate === target) return pcm;
    const length = Math.floor(pcm.length * target / sampleRate);
    const out = new Float32Array(length);
    // A compact windowed-sinc polyphase resampler with anti-aliasing when
    // downsampling 44.1/48 kHz microphone audio to the 16 kHz reference input.
    const ratio = sampleRate / target;
    const width = 16, taps = width * 2, phases = 256;
    const cutoff = 0.94 * Math.min(1, target / sampleRate);
    const table = new Float32Array(phases * taps);
    for (let phase = 0; phase < phases; phase++) {
      const frac = phase / phases;
      for (let t = 0; t < taps; t++) {
        const distance = t - width + 1 - frac;
        const phaseX = Math.PI * cutoff * distance;
        const sinc = Math.abs(phaseX) < 1e-9 ? cutoff :
          cutoff * Math.sin(phaseX) / phaseX;
        const window = Math.abs(distance) <= width ?
          (0.5 + 0.5 * Math.cos(Math.PI * distance / width)) : 0;
        table[phase * taps + t] = sinc * window;
      }
    }
    for (let j = 0; j < length; j++) {
      const pos = j * ratio, center = Math.floor(pos);
      const phase = Math.min(phases - 1, Math.floor((pos - center) * phases));
      const first = center - width + 1;
      let sum = 0, norm = 0;
      for (let t = 0; t < taps; t++) {
        const idx = first + t;
        if (idx < 0 || idx >= pcm.length) continue;
        const w = table[phase * taps + t];
        sum += pcm[idx] * w;
        norm += w;
      }
      out[j] = norm ? sum / norm : 0;
    }
    return out;
  }

  function fftPower(frame) {
    const n = frame.length, re = Float64Array.from(frame), im = new Float64Array(n);
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        [re[i], re[j]] = [re[j], re[i]];
        [im[i], im[j]] = [im[j], im[i]];
      }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const angle = -2 * Math.PI / len, c = Math.cos(angle), s = Math.sin(angle);
      for (let start = 0; start < n; start += len) {
        let wr = 1, wi = 0;
        for (let k = 0; k < len / 2; k++) {
          const i = start + k, j = i + len / 2;
          const xr = wr * re[j] - wi * im[j], xi = wr * im[j] + wi * re[j];
          re[j] = re[i] - xr; im[j] = im[i] - xi;
          re[i] += xr; im[i] += xi;
          const nextR = wr * c - wi * s;
          wi = wr * s + wi * c; wr = nextR;
        }
      }
    }
    const power = new Float64Array(n / 2 + 1);
    for (let k = 0; k < power.length; k++) power[k] = re[k] * re[k] + im[k] * im[k];
    return power;
  }

  function pitchHz(segment, sr, rms) {
    if (rms < 0.008) return null;
    let best = 0, lagBest = 0;
    const lo = Math.round(sr / 500), hi = Math.round(sr / 65);
    // Normalized overlap correlation, with a simple autocorrelation peak test.
    for (let lag = lo; lag <= hi; lag++) {
      let cross = 0, p0 = 0, p1 = 0;
      for (let i = 0; i < segment.length - lag; i++) {
        const a = segment[i], b = segment[i + lag];
        cross += a * b; p0 += a * a; p1 += b * b;
      }
      const score = cross / Math.max(1e-9, Math.sqrt(p0 * p1));
      if (score > best) { best = score; lagBest = lag; }
    }
    return best > 0.74 && lagBest ? sr / lagBest : null;
  }

  function quantile(sorted, p) {
    if (!sorted.length) return null;
    const pos = (sorted.length - 1) * p, lo = Math.floor(pos), hi = Math.ceil(pos);
    return lo === hi ? sorted[lo] : sorted[lo] * (hi - pos) + sorted[hi] * (pos - lo);
  }
  const fix = (n, places = 3) => Number.isFinite(n) ? Number(n.toFixed(places)) : null;

  function analyze(input, inputRate) {
    const audio = resample(input, inputRate);
    const n = audio.length;
    if (n < FFT_SIZE) throw Error("Please record at least 0.1 seconds of sound");
    const frame = new Float32Array(FFT_SIZE);
    const gateEnergy = new Float64Array(12), pitches = [], rmsValues = [];
    let peak = 0, sumSquares = 0, clipped = 0;
    for (let i = 0; i < n; i++) {
      const v = Number.isFinite(audio[i]) ? Math.max(-1, Math.min(1, audio[i])) : 0;
      peak = Math.max(peak, Math.abs(v));
      sumSquares += v * v;
      if (Math.abs(v) >= 0.99) clipped++;
    }
    const hop = Math.max(Math.floor(0.08 * TARGET_RATE),
      Math.ceil(Math.max(0, n - FFT_SIZE) / 460));
    let onsets = 0, prevRms = 0, frames = 0;
    for (let offset = 0; offset + FFT_SIZE <= n; offset += hop) {
      let avg = 0, energy = 0;
      for (let i = 0; i < FFT_SIZE; i++) avg += audio[offset + i];
      avg /= FFT_SIZE;
      for (let i = 0; i < FFT_SIZE; i++) {
        const v = audio[offset + i] - avg;
        energy += v * v;
        frame[i] = v * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (FFT_SIZE - 1)));
      }
      const rms = Math.sqrt(energy / FFT_SIZE);
      rmsValues.push(rms);
      // A rough energy-activity onset proxy; not words per minute or syllable recognition.
      if (rms > 0.02 && rms > 1.55 * prevRms && prevRms > 0) onsets++;
      prevRms = 0.65 * prevRms + 0.35 * rms;
      if (frames % 2 === 0) {
        const f0 = pitchHz(audio.subarray(offset, offset + FFT_SIZE), TARGET_RATE, rms);
        if (f0 !== null) pitches.push(f0);
      }
      const powers = fftPower(frame);
      for (let k = 0; k < powers.length; k++) {
        const f = k * TARGET_RATE / FFT_SIZE;
        for (let j = 0; j < 12; j++) {
          if ((f >= GATES[j] && f < GATES[j + 1]) ||
              (k === FFT_SIZE / 2 && j === 11)) {
            gateEnergy[j] += powers[k]; break;
          }
        }
      }
      frames++;
    }
    pitches.sort((a, b) => a - b);
    const spectralTotal = gateEnergy.reduce((a, b) => a + b, 0);
    const shares = Array.from(gateEnergy, (v) => spectralTotal ? v / spectralTotal : 0);
    let centroid = 0;
    for (let j = 0; j < 12; j++) centroid += ((GATES[j] + GATES[j + 1]) / 2) * shares[j];
    return {
      schema: "nathan-voice-profile/1",
      metrics_only: true,
      sample_rate_hz: TARGET_RATE,
      duration_seconds: fix(n / TARGET_RATE, 2),
      rms: fix(Math.sqrt(sumSquares / n), 6),
      peak: fix(peak, 6),
      clipped_percent: fix(100 * clipped / n, 3),
      mean_band_centroid_hz: fix(centroid, 1),
      median_f0_hz: fix(quantile(pitches, 0.5), 1),
      p10_f0_hz: fix(quantile(pitches, 0.1), 1),
      p90_f0_hz: fix(quantile(pitches, 0.9), 1),
      voiced_frames_sampled: pitches.length,
      measured_frames: frames,
      rhythm_onset_proxy_per_minute: fix(onsets / (n / TARGET_RATE) * 60, 1),
      spectral_gate_shares: shares.map((v) => fix(v, 6)),
      gate_edges_hz: GATES.slice(),
      interpretation: "Acoustic fingerprint only. Not an identity match, dialect inference, emotion detector, or synthetic voice model."
    };
  }

  function assessRecording(profile) {
    if (!profile || profile.schema !== "nathan-voice-profile/1")
      throw Error("Invalid voice profile");
    const blockers=[], advisories=[];
    if (profile.duration_seconds < 2)
      blockers.push("Record at least two seconds");
    if (profile.rms < 0.004)
      blockers.push("The recording is silent or too quiet");
    else if (profile.rms < 0.02)
      advisories.push("Raise the microphone level slightly");
    if (profile.clipped_percent > 5)
      blockers.push("Audio is heavily clipped; move away from the microphone");
    else if (profile.clipped_percent > 0.25)
      advisories.push("Some clipping detected; lower input gain");
    if (profile.voiced_frames_sampled === 0 && profile.rms >= 0.004)
      advisories.push("No stable voiced pitch found; speak clearly and reduce background noise");
    // A quality hint about this sample only, never an estimate of voice identity.
    return {usable_for_reference: blockers.length===0, blockers, advisories,
      note:"Heuristic recording-quality checks. Not a voice biometric, accent analysis, or diagnosis."};
  }

  return { analyze, assessRecording, resample, GATES, FFT_SIZE };
});
