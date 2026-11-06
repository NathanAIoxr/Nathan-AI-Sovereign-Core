# NATHAN AI — UNIVERSAL VOICE BOX
**Micro + Macro · Offline-first · Additive ONE module · No faces**

A working reference implementation of a local speech-synthesis control panel, an extensible installed-language catalog, a bounded acoustic-effects processor, a 12-band signal analyzer, and a native C++ DSP ABI. Designed for further Android/iOS embedding without any cloud-dependent speech path.

**Status (2026-11-06):** Desktop/edge reference application and native DSP source. Not yet a shipping Android APK or iOS IPA; not a trained voice-cloning model. Dynamic conversation requires a separately installed, truly local dialogue engine.

## Run the working offline reference

Requirements: Python 3.11+ and an installed `espeak-ng` executable. No pip packages required for the basic local voice.

```sh
# On Debian/Ubuntu:
sudo apt-get install espeak-ng

cd app-factory/one/nathan-voice-box
python3 voicebox.py voices
python3 voicebox.py speak --text "Hello from Nathan AI" --lang en-US --voice en-us --out hello.wav
python3 voicebox.py analyze hello.wav
python3 voicebox.py serve --port 8765
```

Open **http://127.0.0.1:8765** on the same machine. The page speaks through the local Python process and the installed eSpeak NG binary, rather than through a cloud browser speech service. The server binds only to 127.0.0.1; there are no external scripts, requests, trackers or model-download paths.

If your local eSpeak installation calls the English US voice `english-us` rather than `en-us`, choose its installed name from the panel or run `python3 voicebox.py voices`.

**Family archive:** the browser plays a file selected on the user's machine without uploading it. This is archival playback, not voice cloning. To synthesize fresh text in an authorized voice, provision a compatible on-device neural model under `private-packs/<pack-id>/` with a rights manifest; the repository does not contain private recordings, cloned voice weights, or models.

**Mythic roles:** Jesus and Satan are *fictional dramatic presets*. No authentic recording or recoverable anatomical voice of either is claimed. The presets alter an installed synthetic voice only.

## Architecture: strict local processing

```text
TEXT / SELECTED LOCAL RECORDING
      │
BCP-47 language + dialect metadata ── local voice catalog
      │
AUTHORIZED VOICE REGISTRY ── consent/estate/license policy
      │
MICRO ENGINE ── eSpeak NG or pre-installed sherpa-onnx VITS pack
      │
16-bit mono PCM WAV
      │
MACRO ENGINE ── cave / echo / wind / clean bounded DSP
      │
12 EAR GATES ── 12 measured, non-overlapping spectral bands
      │
LOCAL PLAYBACK / DOWNLOAD ── system audio output / transducer
```

**Micro implementation:** `voicebox.py` supplies local text input validation, offline eSpeak NG synthesis, a sherpa-onnx VITS model-pack adapter, and PCM WAV handling. No model is fetched automatically. eSpeak NG has broad but finite language/dialect coverage; installed models define the *actual* supported choices. BCP-47 support means the registry can name languages, **not** that speech generation in every one is solved.

**Macro implementation:** independent deterministic `none`, `cave`, `echo`, `wind`, and `speech-clean` modes (local high-pass plus smoothed noise gate, not neural denoising); 12 actual spectral energy buckets, RMS, peak, crest, zero-crossing rate, centroid, and normalized band entropy. These are signal measurements, not medical, emotional or truth detectors. No inaudible carrier is used to manipulate fear or behavior.

**Mobile DSP:** `native/edge_dsp.cpp` exports a C ABI; its processing loop performs no heap allocation or network I/O. Connect to Apple AudioUnit/AVAudioEngine or Android AAudio/Oboe from the host app; device discovery, speaker/haptic capabilities, actuator limits, audio permissions and safe volume controls belong to the native host. Surface transducers are ordinary audio output peripherals, not a way around OS permissions.

**48-Axis relation:** the pre-existing private formula registry defines MER4x6 = four waveform transforms × six measurements (24 coordinates), and the 12 Ear Gates. An optional bidirectional pass may yield 48 *positions*; it does not automatically create 48 independent scientific properties. This implementation preserves the existing formula design as a separate module and does not overwrite or claim to have verified the private 59-formula source. The analyzer here is a distinct operational DSP layer.

## Authorized local ONNX voice packs

1. Install **sherpa-onnx** for the actual target platform (a package installation is not a cloud call).
2. Obtain a correctly licensed VITS/ONNX model, tokens, and its eSpeak data locally; **check the specific model/voice license independently of the engine license**.
3. Create the *private* directory `private-packs/my-voice/`, including model files and `manifest.json` derived from `private-packs/MANIFEST_EXAMPLE.json`.
4. Document permission and rights locally, set `authorized: true` only after verification and choose a truthful basis (`self`, `speaker-consent`, `estate-authorization` or `licensed-synthetic`). Never commit consent evidence, audio or voice weights to a public repository.
5. Use `--pack my-voice` or the UI's local pack field. No remote API key or paid speech token is involved.

A manifest attestation is a first-layer policy gate, **not cryptographic proof of consent or full legal compliance**. Production requires authenticated owner controls, protected storage and an auditable consent/revocation workflow. An inherited grandmother's recording is not automatically permission to impersonate her; use archival playback until the rights question is settled. For living people, obtain explicit authorization; for deceased people, check applicable estate/personality/privacy rights. Do not use voices for deception, fabricated evidence, or impersonation.

## Open-source runtime strategy (libraries are NOT vendored)

| Dependency | Role | License note |
|---|---|---|
| [eSpeak NG](https://github.com/espeak-ng/espeak-ng) | Offline phoneme-based synthetic TTS, current CLI adapter | GPL-3.0-or-later; packaging requires license review |
| [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) | Offline ONNX TTS/STT, C++/mobile edge APIs, VITS adapter | Apache-2.0; voice models have separate licenses |
| [ONNX Runtime](https://github.com/microsoft/onnxruntime) | Low-overhead inference runtime used by compatible models | MIT; on-device acceleration varies by hardware |
| [Piper](https://github.com/OHF-Voice/piper1-gpl) | Alternative local compact TTS, not yet wired to this module | GPL-3.0; optional alternative, not a hidden dependency |
| [whisper.cpp](https://github.com/ggml-org/whisper.cpp) | Optional future offline ASR/voice-input layer | Review upstream code and model licenses before bundling |

Downloading a model once for installation is different from cloud inference; verify offline operation with network disabled after provisioning. `sherpa-onnx` and native acceleration vary by model, hardware and runtime version. INT8 can reduce size, but is neither universally supported nor guaranteed faster.

## Privacy and product limits

- No analytics, cloud services, external browser scripts, voice uploads, secrets, or implicit recording. Sample recordings selected in Family Archive never reach the Python server.
- No model weights are shipped; no voice cloning/training/reconstruction from a 3-second clip is implemented by this reference.
- Local WAV generation uses memory until a user deliberately saves audio. The separate private model directory is the owner's responsibility.
- The private pack directory is Git-ignored. Encrypt production assets at rest with platform key storage; **this reference does not pretend the Secure Enclave stores whole model files**.
- The loopback UI uses a random per-process session token, strict same-origin checks, and no CORS permission. It is a local development panel, not a production multi-user server.
- No guarantee of speech in all 7,000+ living languages, every dialect, or lost languages. Unsupported languages require licensed local packs, phoneme dictionaries, field recordings and validation.
- No assumption that the same phonetics, accent, or timbre transfer faithfully between languages. Cross-lingual cloning requires separately evaluated models and quality tests.

## Quality gates

```sh
python3 -m unittest discover -s tests -p 'test_*.py' -v
c++ -std=c++17 -O2 -Wall -Wextra native/test_edge.cpp -o /tmp/nathan-edge-dsp-test
/tmp/nathan-edge-dsp-test
```

CI additionally provisions an offline eSpeak NG executable and synthesizes / analyzes a genuine WAV. See `docs/ROOTS_AND_ROADMAP.md` for historical preservation and later mobile release gates.

**Invariants:** `1 + 1 = 2 — BUILD` and `1 - 1 = 0 — CLEAR`. Preserve all original Nathan AI archives and formula source verbatim; new research, testing and adaptations remain separate additive layers.
