export const scores = Object.freeze({
  stomp: Object.freeze({
    meter: '4/4', measures: null, stanzas: null, bpm: 96, subdivision: 1,
    beats: Object.freeze(['Stomp', 'Stomp', 'Clap', 'Rest']),
    sounds: Object.freeze(['stomp', 'stomp', 'clap', 'rest']),
  }),
  stille: Object.freeze({
    meter: '6/8', measures: 72, stanzas: 6, bpm: 56, subdivision: 3,
    beats: Object.freeze(['1', '2', '3', '4', '5', '6']),
    sounds: Object.freeze(['accent', 'tick', 'tick', 'accent', 'tick', 'tick']),
  }),
});

export const interval = (score, bpm) => 60 / (bpm * score.subdivision);

export function locate(score, step) {
  const beat = step % score.beats.length;
  const measure = Math.floor(step / score.beats.length) + 1;
  return {
    beat, measure, finished: score.measures !== null && measure > score.measures,
    stanza: score.stanzas === null ? null : Math.ceil(measure / (score.measures / score.stanzas)),
    sound: score.sounds[beat],
  };
}
