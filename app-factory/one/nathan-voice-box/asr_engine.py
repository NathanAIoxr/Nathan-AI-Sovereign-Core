"""Optional on-device speech-to-text for self-recorded reference audio.
No model download, cloud request, telemetry, persistent file or third-party API.
A user must check/correct the transcript; recognition does not establish identity.
"""
from __future__ import annotations
from voicebox import VoiceBoxError, load_pack, language_code
from clone_engine import _reference_pcm

def transcribe_reference(pack_id: str, reference_wav_base64: str, language: str) -> dict:
    if not isinstance(language, str):
        raise VoiceBoxError("Select a language for local transcription")
    language_code(language)
    pack = load_pack(pack_id)
    if pack["runtime"] != "sherpa-onnx-whisper-asr":
        raise VoiceBoxError("Install an authorized offline Whisper speech-recognition pack")
    codes = [s.lower() for s in pack["languages"]]
    full, base = language.lower(), language.lower().split("-")[0]
    if not any(c == full or c.split("-")[0] == base for c in codes):
        raise VoiceBoxError("This ASR pack does not support the selected language")
    samples, rate = _reference_pcm(reference_wav_base64)
    try:
        import numpy as np
        import sherpa_onnx
    except ImportError as exc:
        raise VoiceBoxError("Install numpy and sherpa-onnx locally for transcription") from exc

    # Supported API from sherpa-onnx's official offline-decode-files.py example.
    recognizer = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=pack["encoder"], decoder=pack["decoder"], tokens=pack["tokens"],
        num_threads=2, decoding_method="greedy_search",
        language=base, task="transcribe", debug=False
    )
    stream = recognizer.create_stream()
    stream.accept_waveform(rate, np.asarray(samples, dtype=np.float32) / 32768.0)
    recognizer.decode_stream(stream)
    text = stream.result.text.strip()
    if len(text) > 2000:
        raise VoiceBoxError("Transcription unexpectedly exceeded limit")
    return {
        "text": text,
        "language": language,
        "source": "local-whisper-asr",
        "requires_human_review": True,
    }
