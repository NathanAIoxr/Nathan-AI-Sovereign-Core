# Roots of Sound → Talking Objects → Universal Voice Box

## Evidence ledger (source text is preserved; verification is additive)

- **Geophysical:** Earth hum from persistent seismic motion, audible wind/water turbulence, volcanic acoustic blasts, and magnetospheric electromagnetic whistlers. EM whistlers become *audio* after radio receiver conversion; they are not ordinary pressure sound already propagating in vacuum.
- **Natural architecture:** caves and valleys reflect, filter and focus sound. Archaeological acoustic associations are research topics; not every cave painting location has proven intentional sound placement.
- **Ancient Egypt:** museum-verified sistrums and clappers produce kinetic sound. Water clocks are verified timekeepers; claims that a given Egyptian clock used whistle/bell-striking automation need direct artifacts or contemporary descriptions. Surviving Anubis masks do not by themselves establish hidden jaw-pulley amplification.
- **Later ancient automata:** Hero of Alexandria describes water/air-powered effects. Distinguish documented treatises from reconstruction.
- **Toys:** music boxes, phonographic dolls, spring-loaded talking toys; physical storage and mechanical transduction before digital codecs.
- **Telegraph and computers:** keyed electromagnetic sound and Morse-style signalling predate silicon audio; Manchester's diagnostic hooter and early software pulse-generation demonstrate computer-controlled sound. Mechanisms share vibration and signal encoding; this is not proof that every technology was copied directly from its predecessor.
- **Life:** mammal larynx/vocal folds, some reptiles' voiced calls and hisses, insect stridulation/timbals, fish sonic muscles and swimming bladder resonance, birds' syrinx.
- **Human language:** voiced and unvoiced phonemes, dialects, formants, pitch and prosody. Acoustic patterns alone do not reliably reveal lies, personality, health conditions or intent.
- **Devices:** spring record, analog tape, oscillators, digital pulse synthesis, VITS/ONNX vocoders, DAC, speaker/transducer. A quartz timing oscillator is a frequency reference; it does not physically act as a DAC.

## Product coverage: existing versus later work

| Capability | Present in this commit | Mobile/production next step |
|---|---|---|
| Offline text-to-speech | eSpeak NG desktop adapter | Embed native sherpa-onnx & platform audio |
| Language/dialect registry | Runtime installed-voice listing + BCP-47 tags | Per-language phonemizers & model metadata |
| Family recording | Local-file playback, no upload | Device encrypted archive + access permissions |
| Consent-gated voice models | Local VITS manifest + model adapter | Verified consent receipt, revocation, anti-impersonation controls |
| Self-recorded voice mapping | **Implemented** in browser worker | Validate pitch, rhythm and twelve-band measurements across accents |\n| Reference-audio voice inference | **Implemented** through optional local ZipVoice pack | Verify model files/rights, benchmark language-specific results |\n| Cross-lingual clone training | **Not implemented** | Authorized enrollment and quality eval; no 3-second fidelity promise |
| Historical/mythic voices | Clearly labeled fictional synthetic presets | Script, local model quality and contextual annotations |
| Planetary audio | Safe local echo/cave/wind DSP | Verified gain/volume measurement and accessibility settings |
| 12 Ear Gates | Actual 12-band FFT energy distribution | Calibrated reference curves, test vectors, public spec |
| MER4×6 / 48 axes | Original design referenced without rewriting | Independent implementation with 24/48 cell audit |
| Speech-to-text | **Not implemented** | Local sherpa-onnx or whisper.cpp, user-triggered microphone permission |
| Translation / lost languages | **Not implemented** | Licensed offline pack + linguist verification |
| Physical talking objects | Portable native C interface, Android JNI/Kotlin capture + ZipVoice source adapter | Hardware-specific Oboe/AudioUnit, iOS speech inference and safe transducer routes |

## Required release gates

1. Android/iOS native builds with no microphone permission by default, explicit user-driven recording and app lifecycle safeguards.
2. CPU/NPU benchmarking by device: measured real-time factor, memory, cold start, battery and thermal behavior.
3. Offline proof: airplane-mode test, deny all network permissions, inspect native and library telemetry defaults.
4. Spectral and acoustic safety: loudness caps, peak limiter, non-destructive audition and surface-transducer thermal limits.
5. Language tests across scripts, RTL direction, non-Latin writing systems, tones, code-switching and local dialect corpora.
6. Model/voice license receipts and consent verification, refusal/revocation and deletion UX; local asset encryption where feasible.
7. Accessibility and privacy review, platform store review, licensing review. Do not market this prototype as universally legally compliant.

## Primary external research/reference links

- [sherpa-onnx source and mobile examples](https://github.com/k2-fsa/sherpa-onnx)
- [sherpa-onnx Python TTS example](https://github.com/k2-fsa/sherpa-onnx/blob/master/python-api-examples/offline-tts.py)
- [eSpeak NG](https://github.com/espeak-ng/espeak-ng)
- [Open Home Foundation Piper](https://github.com/OHF-Voice/piper1-gpl)
- [ONNX Runtime](https://github.com/microsoft/onnxruntime)
- [IEEE account of Turing and the Manchester hooter](https://spectrum.ieee.org/alan-turing-music)
- [Metropolitan Museum collection](https://www.metmuseum.org/art/collection)

This record is a derivative research ledger. Preserve original J-Matrix, ancient-Egypt, sound, voice, and Nathan AI archives unchanged in their own independent source tracks.
