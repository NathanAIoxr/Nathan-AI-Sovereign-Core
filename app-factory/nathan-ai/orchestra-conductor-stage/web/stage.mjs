import { interval, locate, scores } from './score.mjs';

const byId = id => document.getElementById(id);
const play = byId('play');
const tap = byId('tap');
const bpm = byId('bpm');
const mute = byId('mute');
const trackInfo = byId('track-info');
const recording = byId('recording');
const canvas = byId('crosshair');
const ink = canvas.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

let score = scores.stomp;
let context;
let audioOut;
let clapBuffer;
let recordingUrl;
let timer;
let frameId;
let step = 0;
let nextTime = 0;
let last;
let scheduled = [];
let snapUntil = 0;
let beatNodes = [];
let points = 0;
const voices = new Set();

function strike(sound, when) {
  if (sound === 'rest') return;
  const level = context.createGain();
  level.connect(audioOut);
  const clap = sound === 'clap';
  const source = clap ? context.createBufferSource() : context.createOscillator();
  const duration = clap ? .21 : sound === 'stomp' ? .19 : .055;
  if (clap) {
    source.buffer = clapBuffer;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1700;
    filter.Q.value = .7;
    source.connect(filter).connect(level);
  } else {
    const low = sound === 'stomp';
    source.type = low ? 'triangle' : 'sine';
    source.frequency.setValueAtTime(low ? 105 : sound === 'accent' ? 810 : 535, when);
    if (low) source.frequency.exponentialRampToValueAtTime(38, when + duration);
    source.connect(level);
  }
  level.gain.setValueAtTime(sound === 'stomp' ? .74 : clap ? .45 : .16, when);
  level.gain.exponentialRampToValueAtTime(.001, when + duration);
  source.start(when);
  source.stop(when + duration);
  voices.add(source);
  source.onended = () => {
    voices.delete(source);
    source.disconnect();
    level.disconnect();
  };
}

async function enableAudio() {
  if (!context) {
    context = new AudioContext();
    audioOut = context.createGain();
    audioOut.connect(context.destination);
    clapBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * .22), context.sampleRate);
    const samples = clapBuffer.getChannelData(0);
    let random = 7;
    for (let i = 0; i < samples.length; i++) {
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
      samples[i] = (random / 2147483648 - 1) * (1 - i / samples.length);
    }
  }
  await context.resume();
  audioOut.gain.value = mute.checked ? 0 : .45;
}

function enqueue() {
  const now = context.currentTime;
  const duration = interval(score, Number(bpm.value));
  if (nextTime < now - duration) {
    const skipped = Math.floor((now - nextTime) / duration);
    step += skipped + 1;
    nextTime += (skipped + 1) * duration;
  }
  while (nextTime < now + .12) {
    const cue = locate(score, step++);
    scheduled.push({ ...cue, time: nextTime, duration });
    if (cue.finished) {
      clearInterval(timer);
      return;
    }
    strike(cue.sound, Math.max(now, nextTime));
    nextTime += duration;
  }
}

function stop(status = 'Ready for rehearsal') {
  clearInterval(timer);
  timer = undefined;
  scheduled = [];
  last = undefined;
  cancelAnimationFrame(frameId);
  snapUntil = 0;
  draw(0);
  for (const voice of voices) voice.stop();
  play.textContent = 'Start rehearsal';
  tap.disabled = true;
  byId('status').textContent = status;
  beatNodes.forEach(node => {
    node.classList.remove('active');
    node.removeAttribute('aria-current');
  });
}

play.addEventListener('click', async () => {
  if (timer !== undefined) {
    stop();
    return;
  }
  play.disabled = true;
  try {
    await enableAudio();
    step = 0;
    points = 0;
    last = undefined;
    nextTime = context.currentTime + .08;
    timer = setInterval(enqueue, 25);
    enqueue();
    frameId = requestAnimationFrame(frame);
    play.textContent = 'Stop rehearsal';
    tap.disabled = false;
    byId('feedback').textContent = 'Tap on the highlighted cue.';
    byId('status').textContent = 'Rehearsing';
  } catch {
    stop('Audio could not start');
  } finally {
    play.disabled = false;
  }
});

function resetScore() {
  const selection = document.querySelector('input[name=score]:checked');
  score = scores[selection.value];
  bpm.value = score.bpm;
  byId('beats').replaceChildren(...score.beats.map((label, i) => {
    const line = document.createElement('li');
    line.textContent = label;
    line.classList.toggle('rest', score.sounds[i] === 'rest');
    return line;
  }));
  beatNodes = [...byId('beats').children];
  byId('position').textContent = score.measures ? '6/8 · Measure 1 of 72' : '4/4 · Loop';
  updateTempo();
  byId('feedback').textContent = 'Start rehearsal, then tap along.';
}

function updateTempo() {
  byId('tempo').value = bpm.value + ' BPM';
}

bpm.addEventListener('input', updateTempo);
for (const control of document.querySelectorAll('input[name=score]')) {
  control.addEventListener('change', () => { stop(); resetScore(); });
}
mute.addEventListener('change', () => {
  if (audioOut) audioOut.gain.setTargetAtTime(mute.checked ? 0 : .45, context.currentTime, .008);
});

function conduct() {
  if (timer === undefined || !context) return;
  snapUntil = performance.now() + 170;
  const now = context.currentTime;
  const candidates = [last, ...scheduled].filter(cue => cue && !cue.finished);
  const nearest = candidates.reduce((best, cue) =>
    !best || Math.abs(now - cue.time) < Math.abs(now - best.time) ? cue : best, null);
  if (!nearest) return;
  const error = now - nearest.time;
  if (nearest.sound === 'rest') {
    byId('feedback').textContent = 'Rest. Hold the cue.';
  } else if (Math.abs(error) <= Math.min(.13, nearest.duration * .44)) {
    if (!nearest.tapped) {
      nearest.tapped = true;
      points++;
    }
    byId('feedback').textContent = 'On beat · ' + points + ' matched';
  } else {
    byId('feedback').textContent = error < 0 ? 'A little early.' : 'A little late.';
  }
}

tap.addEventListener('click', conduct);
document.addEventListener('keydown', event => {
  if (event.code !== 'Space' || event.repeat || tap.disabled ||
      event.target.closest('button,input,a,audio')) return;
  event.preventDefault();
  conduct();
});

byId('track').addEventListener('change', event => {
  recording.pause();
  recording.removeAttribute('src');
  if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  const file = event.target.files[0];
  recording.hidden = !file;
  trackInfo.textContent = '';
  if (file) {
    recordingUrl = URL.createObjectURL(file);
    recording.src = recordingUrl;
    trackInfo.textContent = 'Local track · use Play to start it alongside the rehearsal.';
  } else {
    recordingUrl = undefined;
  }
  recording.load();
});

function draw(time) {
  if (!ink) return;
  const { clientWidth: width, clientHeight: height } = canvas;
  const resolution = Math.min(devicePixelRatio, 2);
  const pixelWidth = Math.round(width * resolution);
  const pixelHeight = Math.round(height * resolution);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  ink.setTransform(resolution, 0, 0, resolution, 0, 0);
  ink.clearRect(0, 0, width, height);
  const x = width * .76;
  const y = height * .46;
  const r = Math.min(width, height) * .42;
  const snapped = time < snapUntil;
  const phase = reducedMotion.matches ? 0 : time / 800;
  ink.lineWidth = 1;
  const vectors = [0, 90, 180, 270, 27, 45, 142, 207, 225, 322, 8, 188];
  vectors.forEach((degrees, i) => {
    const angle = degrees * Math.PI / 180;
    const wave = i >= 10 && !snapped && !reducedMotion.matches;
    const drift = snapped ? 0 : Math.sin(phase + i * .8) * 8;
    ink.beginPath();
    ink.moveTo(x, y + drift);
    for (let p = 1; p <= 14; p++) {
      const reach = r * p / 14;
      const bend = wave ? Math.sin(p * .65 + phase) * 9 * p / 14 : 0;
      ink.lineTo(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach + drift + bend);
    }
    ink.strokeStyle = snapped ? '#f6be88a6' : '#e09c795c';
    ink.stroke();
  });
  for (const ratio of [.25, .55, .93]) {
    ink.beginPath();
    ink.arc(x, y, r * ratio, 0, Math.PI * 2);
    ink.strokeStyle = '#df9e723f';
    ink.stroke();
  }
}

function frame(time) {
  if (timer !== undefined && context) {
    while (scheduled.length && scheduled[0].time <= context.currentTime) {
      const current = scheduled.shift();
      if (current.finished) {
        stop('Rehearsal complete');
        byId('feedback').textContent = points + ' matched cues across six stanzas.';
        break;
      }
      if (last) {
        beatNodes[last.beat].classList.remove('active');
        beatNodes[last.beat].removeAttribute('aria-current');
      }
      last = current;
      beatNodes[current.beat].classList.add('active');
      beatNodes[current.beat].setAttribute('aria-current', 'step');
      if (current.sound !== 'rest') snapUntil = time + 145;
      if (score.measures) byId('position').textContent =
        'Stanza ' + current.stanza + ' · Measure ' + current.measure + ' of ' + score.measures;
    }
  }
  draw(time);
  if (timer !== undefined) frameId = requestAnimationFrame(frame);
}

resetScore();
new ResizeObserver(() => draw(0)).observe(canvas);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && timer !== undefined) stop();
});
