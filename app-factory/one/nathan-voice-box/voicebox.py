#!/usr/bin/env python3
"""Nathan AI Voice Box — offline micro/macro synthesis reference engine.

No web service, cloud API, analytics, paid inference tokens, or automatic downloads.
Optional dependencies: espeak-ng executable OR sherpa_onnx + an installed ONNX pack.
"""
from __future__ import annotations
import argparse
from array import array
import io
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import wave

ROOT = Path(__file__).resolve().parent
MAX_TEXT = 4000
LANGUAGE = re.compile(r"^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$")
SAFE_VOICE = re.compile(r"^[A-Za-z][A-Za-z0-9+_-]{0,48}$")
EFFECTS = ("none", "cave", "wind", "echo", "speech-clean")
PERSONAS = {
    "neutral": {"pitch": 50, "rate": 165, "description": "Standard synthetic narrator"},
    "jesus-story": {"pitch": 46, "rate": 142, "description": "Fictional dramatization; NOT a historical recording"},
    "satan-story": {"pitch": 24, "rate": 130, "description": "Fictional dramatization; NOT a real entity's voice"},
}
PERMITTED_BASES = {"self", "speaker-consent", "estate-authorization", "licensed-synthetic"}


class VoiceBoxError(Exception):
    pass


def language_code(value: str) -> str:
    if not LANGUAGE.fullmatch(value):
        raise VoiceBoxError("Invalid BCP-47 language tag")
    return value


def list_espeak_voices() -> list[dict]:
    exe = shutil.which("espeak-ng")
    if not exe:
        return []
    cp = subprocess.run([exe, "--voices"], capture_output=True, text=True, timeout=10, check=True)
    voices = []
    for line in cp.stdout.splitlines()[1:]:
        parts = line.split()
        if len(parts) >= 4 and SAFE_VOICE.fullmatch(parts[1]):
            # Prefer the safe locale ID: human-readable eSpeak VoiceName may have spaces/parentheses.
            voices.append({"language": parts[1], "name": parts[1]})
    return voices


def load_pack(pack_id: str | None) -> dict | None:
    if not pack_id:
        return None
    if not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", pack_id):
        raise VoiceBoxError("Invalid pack ID")
    manifest = ROOT / "private-packs" / pack_id / "manifest.json"
    if not manifest.is_file():
        raise VoiceBoxError("Local voice pack not installed: " + pack_id)
    data = json.loads(manifest.read_text(encoding="utf-8"))
    if data.get("id") != pack_id or data.get("runtime") != "sherpa-onnx-vits":
        raise VoiceBoxError("Unsupported voice pack manifest")
    if data.get("authorized") is not True or data.get("rights_basis") not in PERMITTED_BASES:
        raise VoiceBoxError("Voice authorization missing; local pack disabled")
    # No voice records, samples, keys, or consent documents belong in public source control.
    folder = manifest.parent.resolve()
    for key in ("model", "tokens", "data_dir"):
        value = data.get(key)
        if not isinstance(value, str) or not value or Path(value).is_absolute():
            raise VoiceBoxError("Invalid local model asset path")
        target = (folder / value).resolve()
        if not target.is_relative_to(folder) or not target.exists():
            raise VoiceBoxError("Missing or unsafe voice asset: " + key)
        data[key] = str(target)
    return data


def _validate_text(text: str, lang: str) -> None:
    language_code(lang)
    if not isinstance(text, str) or not 0 < len(text.strip()) <= MAX_TEXT:
        raise VoiceBoxError("Text must contain 1 to 4000 characters")


def _wav_from_float(samples, sample_rate: int) -> bytes:
    pcm = array("h", (int(max(-32768, min(32767, round(float(x) * 32767)))) for x in samples))
    if sys.byteorder != "little":
        pcm.byteswap()
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


def _wav_samples(payload: bytes):
    with wave.open(io.BytesIO(payload), "rb") as w:
        if w.getnchannels() != 1 or w.getsampwidth() != 2 or w.getcomptype() != "NONE":
            raise VoiceBoxError("Expected mono, uncompressed 16-bit PCM WAV")
        sr = w.getframerate()
        raw = w.readframes(w.getnframes())
    samples = array("h")
    samples.frombytes(raw)
    if sys.byteorder != "little":
        samples.byteswap()
    return [s / 32768.0 for s in samples], sr


def synthesize_espeak(text: str, lang: str, voice: str, persona: str) -> bytes:
    exe = shutil.which("espeak-ng")
    if not exe:
        raise VoiceBoxError("Install espeak-ng locally; no remote fallback exists")
    if persona not in PERSONAS:
        raise VoiceBoxError("Unknown fictional/synthetic persona")
    if not SAFE_VOICE.fullmatch(voice):
        raise VoiceBoxError("Unsafe voice identifier")
    available = {value for v in list_espeak_voices() for value in (v["name"], v["language"])}
    if voice not in available:
        raise VoiceBoxError("Voice not installed. Run 'voices' for local choices")
    requested = lang.lower().split("-")
    selected = voice.lower().split("-")
    if requested[0] != selected[0] or (len(requested) > 1 and len(selected) > 1 and requested[1] != selected[1]):
        raise VoiceBoxError("Requested language/dialect does not match installed voice")
    cfg = PERSONAS[persona]
    args = [exe, "--stdout", "--stdin", "-v", voice, "-p", str(cfg["pitch"]), "-s", str(cfg["rate"])]
    cp = subprocess.run(args, input=text.encode("utf-8"), capture_output=True,
                        timeout=35, check=False)
    if cp.returncode != 0 or not cp.stdout.startswith(b"RIFF"):
        raise VoiceBoxError("Local speech engine failed: " + cp.stderr[:240].decode("utf-8", "replace"))
    return cp.stdout


def synthesize_onnx(text: str, pack: dict) -> bytes:
    """Use an installed VITS model locally. No model fetch, no voice cloning or training here.

    Different sherpa-onnx releases offer slightly different generate() signatures.
    """
    try:
        import sherpa_onnx
    except ImportError as exc:
        raise VoiceBoxError("Install sherpa-onnx Python runtime locally to use ONNX packs") from exc
    vits = sherpa_onnx.OfflineTtsVitsModelConfig(
        model=pack["model"], tokens=pack["tokens"], data_dir=pack["data_dir"]
    )
    config = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(vits=vits, provider="cpu", num_threads=2)
    )
    if not config.validate():
        raise VoiceBoxError("Invalid offline VITS pack configuration")
    engine = sherpa_onnx.OfflineTts(config)
    try:
        try:
            result = engine.generate(text, sid=int(pack.get("speaker_id", 0)), speed=1.0)
        except TypeError:
            gen = sherpa_onnx.GenerationConfig()
            gen.sid = int(pack.get("speaker_id", 0))
            gen.speed = 1.0
            result = engine.generate(text, gen)
        return _wav_from_float(result.samples, result.sample_rate)
    finally:
        del engine


def process_macro(payload: bytes, effect: str = "none") -> bytes:
    """Safe, deterministic DSP; effects do NOT intentionally generate infrasound."""
    if effect not in EFFECTS:
        raise VoiceBoxError("Unknown effect")
    if effect == "none":
        return payload
    samples, sr = _wav_samples(payload)
    if not samples:
        return payload
    if effect == "speech-clean":
        # Simple local high-pass + smoothed noise gate: NOT full neural denoising.
        rc = 1.0 / (2 * math.pi * 75.0)
        alpha = rc / (rc + 1.0 / sr)
        hp = prev = envelope = 0.0
        gain = 1.0
        cleaned = []
        for x in samples:
            hp = alpha * (hp + x - prev)
            prev = x
            envelope = 0.995 * envelope + 0.005 * abs(hp)
            target = 0.25 if envelope < 0.004 else 1.0
            gain += 0.003 * (target - gain)
            cleaned.append(max(-0.96, min(0.96, hp * gain * 0.94)))
        return _wav_from_float(cleaned, sr)
    delay = max(1, int(sr * (0.17 if effect == "cave" else 0.11)))
    # A bounded single delay avoids unstable recursive feedback and high output levels.
    out = []
    noise_state = 1
    for i, x in enumerate(samples):
        tail = 0.19 * samples[i - delay] if i >= delay else 0.0
        if effect == "wind":
            noise_state = (1664525 * noise_state + 1013904223) & 0xffffffff
            noise = (((noise_state >> 16) / 65535.0) * 2 - 1) * 0.008
            value = 0.91 * x + noise
        elif effect == "echo":
            value = 0.82 * x + (0.28 * samples[i - delay] if i >= delay else 0.0)
        else:
            value = 0.85 * x + tail
        out.append(max(-0.96, min(0.96, value)))
    return _wav_from_float(out, sr)


def _fft(values: list[complex]) -> list[complex]:
    n = len(values)
    a = list(values)
    j = 0
    for i in range(1, n):
        bit = n >> 1
        while j & bit:
            j ^= bit
            bit >>= 1
        j ^= bit
        if i < j:
            a[i], a[j] = a[j], a[i]
    step = 2
    while step <= n:
        tw = complex(math.cos(-2 * math.pi / step), math.sin(-2 * math.pi / step))
        for i in range(0, n, step):
            w = 1 + 0j
            for k in range(i, i + step // 2):
                u, v = a[k], a[k + step // 2] * w
                a[k], a[k + step // 2] = u + v, u - v
                w *= tw
        step *= 2
    return a


def analyze(payload: bytes) -> dict:
    """12 true disjoint spectral bands, plus measured rather than inferred metrics."""
    samples, sr = _wav_samples(payload)
    n = min(512, 1 << (len(samples).bit_length() - 1)) if samples else 0
    if n < 32:
        raise VoiceBoxError("Not enough audio for spectral analysis")
    frame = samples[:n]
    dc = sum(frame) / n
    window = [(frame[i] - dc) * (0.5 - 0.5 * math.cos(2 * math.pi * i / (n - 1))) for i in range(n)]
    fft = _fft([complex(v, 0) for v in window])
    power = [abs(x) ** 2 for x in fft[: n // 2 + 1]]
    nyquist = sr / 2
    nominal = [0, 70, 140, 240, 400, 600, 900, 1300, 1850, 2700, 4000, 6000, nyquist]
    # Maintain 12 nonoverlapping bands and cover the full measurable [0, Nyquist].
    boundaries = [min(nyquist, max(0, v)) for v in nominal]
    boundaries[-1] = nyquist
    bands = [0.0] * 12
    for k, energy in enumerate(power):
        freq = k * sr / n
        for b in range(12):
            if boundaries[b] <= freq < boundaries[b + 1] or (k == n // 2 and b == 11):
                bands[b] += energy
                break
    total = sum(bands)
    fraction = [v / total if total else 0.0 for v in bands]
    entropy = -sum(p * math.log(p) for p in fraction if p) / math.log(12)
    rms = math.sqrt(sum(s * s for s in frame) / n)
    peak = max(abs(v) for v in frame)
    zcr = sum(frame[i - 1] * frame[i] < 0 for i in range(1, n)) / (n - 1)
    centroid = sum((k * sr / n) * p for k, p in enumerate(power)) / max(sum(power), 1e-12)
    return {"sample_rate": sr, "rms": round(rms, 6), "peak": round(peak, 6),
            "crest": round(peak / rms, 4) if rms else None, "zero_crossing_rate": round(zcr, 6),
            "spectral_centroid_hz": round(centroid, 2), "band_energy_share": fraction,
            "band_edges_hz": boundaries, "entropy_12_normalized": round(entropy, 6),
            "interpretation": "Physical signal measurements only; no health, emotion, or lie inference"}


def speak(text: str, lang="en-US", voice="en-us", persona="neutral",
          effect="none", pack_id=None) -> bytes:
    _validate_text(text, lang)
    pack = load_pack(pack_id)
    if pack:
        declared = pack.get("language")
        if declared and declared.lower() != lang.lower():
            raise VoiceBoxError("Pack does not claim the requested language")
        audio = synthesize_onnx(text, pack)
    else:
        audio = synthesize_espeak(text, lang, voice, persona)
    return process_macro(audio, effect)


def main(argv=None):
    p = argparse.ArgumentParser(description="Offline Nathan AI micro/macro voice box")
    sub = p.add_subparsers(dest="command", required=True)
    sub.add_parser("voices", help="Show locally installed eSpeak voices")
    syn = sub.add_parser("speak")
    syn.add_argument("--text", required=True)
    syn.add_argument("--lang", default="en-US")
    syn.add_argument("--voice", default="en-us")
    syn.add_argument("--persona", choices=PERSONAS, default="neutral")
    syn.add_argument("--effect", choices=EFFECTS, default="none")
    syn.add_argument("--pack", help="Authorized local ONNX pack ID (optional)")
    syn.add_argument("--out", required=True)
    ana = sub.add_parser("analyze")
    ana.add_argument("input_wav")
    srv = sub.add_parser("serve")
    srv.add_argument("--port", type=int, default=8765)
    args = p.parse_args(argv)
    try:
        if args.command == "voices":
            print(json.dumps(list_espeak_voices(), indent=2))
        elif args.command == "speak":
            wav = speak(args.text, args.lang, args.voice, args.persona, args.effect, args.pack)
            Path(args.out).write_bytes(wav)
            print("Saved", args.out)
        elif args.command == "analyze":
            print(json.dumps(analyze(Path(args.input_wav).read_bytes()), indent=2))
        else:
            from server import serve
            serve(args.port)
        return 0
    except (VoiceBoxError, OSError, subprocess.TimeoutExpired) as exc:
        print("Voice Box:", exc, file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
