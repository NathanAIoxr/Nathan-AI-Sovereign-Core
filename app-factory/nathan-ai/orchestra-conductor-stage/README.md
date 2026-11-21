# Orchestra Conductor Stage

Conductor Dick Tater opens the stage with Nathan Tabor's “Get down get down get down.” Start rehearsal, then use TAP THAT or Space on a highlighted cue. The 12-Line display snaps on percussion and manual cues. The tempo and mute controls affect generated percussion.

- **STOMP, STOMP, CLAP, REST** uses newly generated percussion with a silent fourth beat.
- **Stille Nacht** is a 6/8 cue rehearsal with 72 measures, six stanzas and accents on counts one and four. It plays a metronome pulse.
- **Load your track** plays a local file with separate transport controls. The browser keeps the file local. Set rehearsal tempo manually when playing both.

The stage links to the existing Orchestra Conductor game, the archived train and orchestra conductor material and the Nathan AI Conductor. TAP THAT rehearsal controls operate within this browser stage.

```sh
node --test score.test.mjs
node build.mjs /tmp/orchestra-conductor-worker.mjs
```

The standalone build contains the stage source and its read-only route handler.
