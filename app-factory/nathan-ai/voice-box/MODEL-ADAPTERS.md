# Open-source engines: device-held, licensing-aware integration plan

Checked November 6, 2026. **Integration stage is explicit**: the browser frontend uses OS-reported local speech voices. This project contains a working eSpeak NG CLI wrapper, but no linked neural model weights or native mobile binaries. No third-party code is vendored.

| Engine | Micro/macro role | Licensing note | Status |
| --- | --- | --- | --- |
| [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) | Local TTS, ASR, VAD and speech enhancement on desktop, iOS/Android, WASM | Core Apache-2.0; each model and embedded dependency needs separate review | Proposed native adapter, not installed |
| [whisper.cpp](https://github.com/ggml-org/whisper.cpp) | Offline/quantized speech recognition | MIT source; verify model terms | Proposed native adapter, not installed |
| [eSpeak NG](https://github.com/espeak-ng/espeak-ng) | Lightweight multilingual local TTS | **GPL-3.0-or-later** | Native CLI wrapper written, user installs executable separately |
| [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) | Neural TTS | Check model license and phonemizer dependency notices (eSpeak NG may add GPL terms) | Research option only |
| [original rhasspy/Piper](https://github.com/rhasspy/piper) | Historical local neural TTS | Archived October 2025; forks/models need separate license review | Not used |
| [Web Speech Synthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService) | User's currently installed voices | Local/remote classification supplied by browser | **Working browser path** |
| [On-device Web Speech Recognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/processLocally) | User-triggered local dictation, where supported | Experimental browser/OS feature and optional language pack | **Gated working browser path**, device-specific |

For actual model-pack expansion: choose device and RAM budget; verify runtime license, *model weights*, phonemizer, attribution, distribution restrictions, language quality and voice rights; require user-initiated installation and cryptographic hash verification; disable automatic background telemetry; test airplane mode and recording/microphone permissions. Do not claim that 66,666 authored catalog destinations equal supported voices.

Future native and WASM packs may be added **additively**. The published static browser page currently cannot execute sherpa-onnx or whisper.cpp without separately deploying their compatible runtimes and model weights. No claim of authentic ancestral or historical voice reconstruction is made.

The supplied PyTorch/Wav2Vec2/GRU sketch uses an audio input feature extractor on a text input and has not been trained as a synthesis model; it is preserved as a proposed direction, not shipped as verified voice cloning code. A person's anatomy or entire linguistic voice profile cannot be reliably derived from a 3-second recording.
