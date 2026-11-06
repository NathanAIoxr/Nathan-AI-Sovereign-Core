"""Reference-audio voice synthesis, entirely on-device via installed ZipVoice ONNX assets.

Works with sherpa-onnx GenerationConfig. No training, downloads, cloud or disk writes.
Only the recording speaker may enroll in the browser interface. Other voice rights
must go through a separate verification and authorization workflow.
"""
from __future__ import annotations

from array import array
import base64
import binascii
import io
import sys
import wave

from voicebox import VoiceBoxError, _validate_text, _wav_from_float, load_pack

MAX_REFERENCE_BYTES = 450_000


def _reference_pcm(encoded: str):
    if not isinstance(encoded, str) or len(encoded) > 660_000:
        raise VoiceBoxError("Reference recording too large")
    try:
        raw = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise VoiceBoxError("Malformed reference audio") from exc
    if len(raw) > MAX_REFERENCE_BYTES:
        raise VoiceBoxError("Reference recording exceeds 12 seconds")
    try:
        with wave.open(io.BytesIO(raw), "rb") as f:
            channels, width, rate, n = f.getnchannels(), f.getsampwidth(), f.getframerate(), f.getnframes()
            if channels != 1 or width != 2 or rate != 16000 or f.getcomptype() != "NONE":
                raise VoiceBoxError("Reference must be 16 kHz mono PCM16 WAV")
            if not (16000 * 2 <= n <= 16000 * 12):
                raise VoiceBoxError("Reference must last between 2 and 12 seconds")
            pcm = f.readframes(n)
    except (wave.Error, EOFError) as exc:
        raise VoiceBoxError("Reference is not valid uncompressed WAV") from exc
    if len(pcm) != n * 2:
        raise VoiceBoxError("Truncated reference audio")
    samples = array("h")
    samples.frombytes(pcm)
    if sys.byteorder != "little":
        samples.byteswap()
    if max(abs(s) for s in samples) < 200:
        raise VoiceBoxError("Reference is silent or very quiet")
    return samples, rate


def _supports(pack: dict, lang: str):
    supported = pack["languages"]
    desired = lang.lower()
    base = desired.split("-")[0]
    return any(s.lower() == desired or s.lower().split("-")[0] == base for s in supported)


def clone_with_reference(text: str, lang: str, pack_id: str,
                         reference_wav_base64: str, reference_text: str,
                         speaker_authorized: bool) -> bytes:
    _validate_text(text, lang)
    if len(text) > 800:
        raise VoiceBoxError("Local zero-shot synthesis is limited to 800 characters per request")
    if speaker_authorized is not True:
        raise VoiceBoxError("The speaker must authorize this voice creation")
    if not isinstance(reference_text, str) or not (3 <= len(reference_text.strip()) <= 2000):
        raise VoiceBoxError("Enter the exact spoken transcript of the reference audio")
    pack = load_pack(pack_id)
    if pack["runtime"] != "sherpa-onnx-zipvoice":
        raise VoiceBoxError("Install an authorized ZipVoice pack for reference-audio cloning")
    if not _supports(pack, lang):
        raise VoiceBoxError("Installed model does not support the requested language")

    pcm, rate = _reference_pcm(reference_wav_base64)
    try:
        import numpy as np
        import sherpa_onnx
    except ImportError as exc:
        raise VoiceBoxError("Install numpy and sherpa-onnx locally to enable voice cloning") from exc

    model = sherpa_onnx.OfflineTtsZipvoiceModelConfig(
        tokens=pack["tokens"], encoder=pack["encoder"], decoder=pack["decoder"],
        vocoder=pack["vocoder"], lexicon=pack["lexicon"],
        data_dir=pack.get("data_dir", ""),
    )
    cfg = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            zipvoice=model, num_threads=2, provider="cpu", debug=False
        )
    )
    if not cfg.validate():
        raise VoiceBoxError("Invalid local ZipVoice model configuration")
    tts = sherpa_onnx.OfflineTts(cfg)
    try:
        options = sherpa_onnx.GenerationConfig()
        options.reference_audio = np.asarray(pcm, dtype=np.float32) / 32768.0
        options.reference_sample_rate = rate
        options.reference_text = reference_text.strip()
        options.num_steps = 4
        out = tts.generate(text, options)
        if len(out.samples) == 0:
            raise VoiceBoxError("Local ZipVoice returned no samples")
        if out.sample_rate < 8000 or out.sample_rate > 96000:
            raise VoiceBoxError("Invalid synthesis sample rate")
        return _wav_from_float(out.samples, out.sample_rate)
    finally:
        del tts
