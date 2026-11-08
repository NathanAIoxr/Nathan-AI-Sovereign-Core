# Nathan AI — Device-First Voice Box

**Additive application by Nathan AI.** The previous Living Eyes (48/96/192/384 views), Living Ears (24 acoustic views), and ONE Sealed Voice Box (encrypted originals) remain independent and unmodified. This module performs speech and audio tasks, **not** encrypted identity or financial account recovery.

## What is built

- **Micro / local speech:** [Open the browser app](index.html). It lists only voice objects marked by the browser \`SpeechSynthesisVoice.localService === true\`, retains exact text, and speaks in bounded chunks. Choose a genuinely installed language/dialect. Missing languages are reported instead of fabricated. Playback speed, output gain, stop and clear are available.
- **Micro / dictation:** explicit Check, Install, Start and Stop actions. Recognition starts only where \`SpeechRecognition.available({langs:[tag],processLocally:true})\` returns \`available\`, and the instance supports \`processLocally=true\`. No online fallback or unattended mic capture. The dictated transcript stays separate from original text until explicitly appended.
- **Micro / family originals:** user-selected local recorded audio plays only after owner confirms rights. **No voice cloning**; this does not synthesize an actual relative's, dead person's, celebrity's, Jesus's or any historical person's voice.
- **Micro / noise:** pure-JS local amplitude gate and PCM16 WAV export of a separate version (first channel, first 30 seconds). The original audio file stays intact. This is not spectral neural denoising and can affect soft speech.
- **Macro / environments:** user-clicked 4-second original cave, water, wind and fictional mythic tonal sketches, bounded to >=120Hz and a maximum software gain of 0.12; not infrasound or accurate environmental recordings. Hardware DAC and crystal oscillator controls are outside the web app.
- **Offline shell:** user-clicked service worker caches only static code and public dependencies. No private text, recordings or microphone streams are cached. Installed OS voices and language packs are separately managed by the device.
- **Native desktop companion:** [native/offline_tts.py](native/offline_tts.py) wraps an *independently installed* eSpeak NG executable to render local WAV using stdin and no cloud/API key; refuses to overwrite existing outputs.
- **Footprint:** the app itself makes zero cloud model calls, uploads zero original sound/text bytes, uses no cloud language-model tokens and never auto-downloads weights. The displayed zero counts **do not** mean phoneme processing or internal model computation requires zero work; browser/OS speech implementations have their own behavior. Verify airplane mode per target device.

## Native CLI usage

From this directory, with eSpeak NG separately installed:

\`\`\`sh
python3 native/offline_tts.py --list
printf 'Hello from Nathan AI' | python3 native/offline_tts.py --voice en --output ./new-speech.wav
\`\`\`

## Route to the open-source full stack

See [MODEL-ADAPTERS.md](MODEL-ADAPTERS.md) for the independently installed sherpa-onnx (TTS/ASR, embedded and phone), whisper.cpp (local ASR), eSpeak NG (local TTS), and Kokoro (open-weight neural TTS) options. **No inference weights, models or third-party engine libraries are actually bundled or installed.** A published public website cannot silently install native mobile models.

The existing [ONE language catalog](../../one/library-mind/LANGUAGE_COVERAGE.md) reports 7,918 indexed languages and a creator target of 66,666. Those are **not 7,918 synthesized voices** nor a guarantee of every dialect. Language support depends on installed phonetic dictionaries, voice packs, model terms, quality and hardware. The user-supplied Wav2Vec2 text-to-audio GRU sketch is not a working pretrained flow-matching voice synthesis network and is not misrepresented here as one.

## Source-preservation, consent and release conditions

- Do not infer person's identity, honesty, emotion, health or intentions from speech; Living Ears remains the forensic acoustic sibling, and Living Eyes remains geometric.
- No unauthorized voice impersonation, false real-person recording, biometric surveillance, covert microphone, compulsory enrollment, synthetic figure claims, or involuntary low-frequency fear-inducing output.
- For the voice or recording of any identifiable person, obtain proper permission and assess applicable copyright, voice/likeness, recording-consent, biometric, consumer-protection and privacy laws by jurisdiction before creating or distributing personalized models. Be explicit that a reproduction is synthetic when applicable. This implementation does **not** certify global legal compliance.
- Public code contains no private family archive, model embeddings, secret keys, recordings, source conversation, or wallet secrets. App does not auto-transfer content to the separate encrypted ONE Offloader.
- Model and dependency **licenses differ from their host source license**; review each bundled voice pack. Do not confuse fictional historical interpretations with an authentic Jesus/Satan/ancient voice.
- Test offline on actual iOS/Android/desktop devices; accessibility and battery/memory performance remain hardware validation work.

## Tests

\`\`\`sh
node --test app-factory/nathan-ai/voice-box/engine.test.cjs
python3 -m unittest discover -s app-factory/nathan-ai/voice-box/native -p 'test_*.py' -v
\`\`\`

Dedicated check: \`.github/workflows/device-voice-box-ci.yml\`.

**1+1=2 BUILD · 1−1=0 CLEAR · YES IS YES — NO IS NO.**


## November 8, 2026 — executable native offline runtime (additive)

The public static browser application remains usable without installation. For stronger offline functionality on a **desktop/laptop**, [NATIVE-RUNTIME.md](NATIVE-RUNTIME.md) describes the new working local HTTP server, independent eSpeak NG WAV synthesis and whisper.cpp speech-to-text buttons. No remote speech API, automatic model download or credential is required.

Browser voice memos are now deliberately user-started, capped at 30 seconds and unloaded automatically on page navigation. An optional native transcription request sends **only to the same device** over a localhost socket, after selection and pressing Transcribe; unlike cloud uploads, this does not leave the local machine. Offline pack and language support remain limited by actual user-installed runtimes and models, not by catalog entries. Both engines are optional. Python backend safety tests and JS resampler tests are included.
