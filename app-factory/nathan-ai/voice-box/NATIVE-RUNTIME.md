# Nathan AI — working native offline speech runtime

This is a **real local executable adapter**, not a cloud API, a voice-cloning provider or a placeholder model call.

## Start

On your desktop/laptop, use Python 3.10+; from repository root:

\`\`\`sh
python3 -B app-factory/nathan-ai/voice-box/native/server.py --port 8765
\`\`\`

Open the URL printed by the program:

\`http://127.0.0.1:8765/app-factory/nathan-ai/voice-box/\`

This serves a **small allowlist of public app assets** and private speech endpoints only on the local loopback interface. It deliberately does **not** expose the entire repository, code files, hidden files, encrypted vault or private documents. Do not open the server on a LAN, tunnel or public address; it cannot bind anything other than 127.0.0.1.

Press **Connect** to inspect whether supported local speech engines are actually installed. Nothing is installed by visiting the page.

## Install the software on the same device (explicit user action)

**Optional TTS engine:** Install [eSpeak NG](https://github.com/espeak-ng/espeak-ng) by its official, OS-appropriate instructions. Confirm the command \`espeak-ng --voices\` works in your local terminal. Its license is GPL-3.0-or-later, not automatically the license of the rest of Nathan AI. The built-in native button sends owner-selected exact text to the eSpeak NG process *through standard input*, uses bounded speed/pitch and receives a temporary WAV. The WAV is not written into the GitHub source tree or persistent app storage. To save, press Download.

**Optional STT engine:** Install [whisper.cpp](https://github.com/ggml-org/whisper.cpp) so \`whisper-cli\` is available on your terminal's PATH. Independently select and download a **lawfully usable** ggml-format Whisper model from the project's documented model sources. Provide an **absolute path to an existing model file** in your local environment:

- On POSIX shells: \`export NATHAN_WHISPER_MODEL=/path/to/your/ggml-model.bin\`
- On Windows PowerShell: \`$env:NATHAN_WHISPER_MODEL="C:\path\to\model.bin"\`

Then start the server from that shell. The server never fetches weights or chooses a model without the user's installation. Public GitHub receives no private model or recording.

The in-app **Transcribe on this device** button locally decodes the user-selected sound, mixes available channels to mono, resamples to **16 kHz PCM16**, and sends only up to 30 seconds to the localhost Python server. That server runs \`whisper-cli\` using a temporary WAV; its separate plain-text transcript is returned only to the same device. Review against the actual recording before appending it to the original speech text. Exact accent, historical language and dialect coverage depend on the model.

Neither engine is required for the original browser-installed speech voice mode. No application secrets or financial credentials are used.

## Protocol and privacy

- \`GET /api/voice/status\` reports local engine readiness, installed eSpeak voice codes, and a **per-process random CSRF authorization token**. The token is returned only by the local service; cross-origin web pages cannot read it because no CORS headers are supplied.
- \`POST /api/voice/synthesize\` accepts at most 4096 UTF-8 bytes of exact selected text, an installed eSpeak voice name, bounded speed/pitch, and returns WAV bytes. Requires same-origin Origin and CSRF header.
- \`POST /api/voice/transcribe\` accepts at most 1 MB of mono PCM16 WAV at exactly 16 kHz and at most 30 seconds. Requires same-origin Origin and CSRF header; language code restricted to documented short codes.
- Only \`127.0.0.1\` Host is accepted. A cross-origin preflight is denied. The local service is single-job-at-a-time and does not write transcripts, recordings or user text outside temporary directories which are automatically removed.
- Inputs are passed to installed programs as **argument arrays**, not as a shell command. Text is sent through standard input, not through process arguments. Model paths are configured locally and never returned by the status API.
- No background microphone capture. The separate recording feature is user-started, stops at 30 seconds or when hidden, and is retained only as an in-memory Blob unless exported.
- The local HTTP transport is cleartext **only on loopback** by design. It is not a remote deployment or multiuser authenticated backend. Avoid using other apps to forward its port.

The status page and model list require no cloud API or paid inference token. Audio/text do travel **locally between the browser and its own loopback server** when a native button is pressed, which is distinct from claiming no byte transfer at all. The public GitHub Pages app makes no such loopback request.

## Tests

\`\`\`sh
python3 -m unittest discover -s app-factory/nathan-ai/voice-box/native -p 'test_*.py' -v
node --test app-factory/nathan-ai/voice-box/native-bridge.test.cjs
\`\`\`

The test suite mocks binary execution; it does **not** prove that a particular user has eSpeak NG or a Whisper model installed. Hardware/OS tests remain necessary.

**Source-preservation invariants:** 1+1=2 BUILD, 1−1=0 CLEAR, preserve originals. No cloned identity, magical anthropological voice claims, or involuntary infrasound.
