# Native Android capture + speech output (integrated source, not APK)

- Add the compatible **sherpa-onnx** Android Kotlin/JNI runtime to the app. Follow its [official Kotlin API](https://github.com/k2-fsa/sherpa-onnx/blob/master/sherpa-onnx/kotlin-api/Tts.kt), license and model distribution rules. The upstream runtime is not bundled in this repository.
- Add `android.permission.RECORD_AUDIO` to the app manifest. Request runtime permission only from the user's explicit microphone button. Do not record in the background.
- Call `LocalVoiceRecorder.record(context, seconds, shouldStop)` on a background dispatcher. It produces an in-memory FloatArray at 16 kHz.
- Run pitch/spectral profiling with a validated local DSP port or the standalone browser Voice Mapper. The Kotlin recorder itself does not invent a neural voice embedding or accent recognition.
- Install compatible ZipVoice encoder, decoder, vocoder, tokens and lexicon inside the app's private model directory. Do not publish private voice samples, tokens, or permission receipts.
- Create `LocalZipVoice(...)`, then call `synthesize(newWords, firstTwelveSeconds, exactTranscript, languageSupportedByPack, speakerConsented)` on a background dispatcher.
- Output `GeneratedAudio.samples` through Android AudioTrack/Oboe with safe volume and correct `GeneratedAudio.sampleRate`.
- Permission checking, UI, encrypted storage, model license audit, language picker, and deletion/consent withdrawal remain native host responsibilities. No signed APK or device benchmark was generated here.

This is a direct Android-native alternate execution path, rather than calling the Python loopback reference server. The existing iOS Swift wrapper only covers the macro DSP, not full native speech synthesis.
