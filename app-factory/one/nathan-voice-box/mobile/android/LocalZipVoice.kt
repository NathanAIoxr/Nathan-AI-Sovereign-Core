package org.nathanai.voicebox

import com.k2fsa.sherpa.onnx.OfflineTts
import com.k2fsa.sherpa.onnx.OfflineTtsConfig
import com.k2fsa.sherpa.onnx.OfflineTtsModelConfig
import com.k2fsa.sherpa.onnx.OfflineTtsZipVoiceModelConfig
import com.k2fsa.sherpa.onnx.GenerationConfig
import com.k2fsa.sherpa.onnx.GeneratedAudio
import java.io.Closeable
import java.io.File

/**
 * Local voice generation using the separately installed sherpa-onnx Android SDK.
 * No cloud APIs, model downloads, voice enrollment uploads, or raw file writes.
 * Model / permission / language checks are the embedding application's responsibility.
 */
class LocalZipVoice(
    sandbox: File,
    encoder: String,
    decoder: String,
    vocoder: String,
    tokens: String,
    lexicon: String,
    dataDir: String = ""
) : Closeable {
    private val model: OfflineTts
    init {
        val root = sandbox.canonicalFile
        require(root.isDirectory)
        fun asset(relative: String): String {
            require(relative.isNotBlank() && !File(relative).isAbsolute)
            val file = File(root, relative).canonicalFile
            require(file.path.startsWith(root.path + File.separator)) {
                "Model assets must remain in the app's private directory"
            }
            require(file.exists()) { "Missing local model asset: $relative" }
            return file.path
        }
        val z = OfflineTtsZipVoiceModelConfig(
            encoder=asset(encoder), decoder=asset(decoder),
            vocoder=asset(vocoder), tokens=asset(tokens),
            lexicon=asset(lexicon),
            dataDir=if (dataDir.isBlank()) "" else asset(dataDir)
        )
        model = OfflineTts(config=OfflineTtsConfig(
            model=OfflineTtsModelConfig(zipvoice=z, numThreads=2, provider="cpu")
        ))
    }

    /**
     * Both caller and recorded speaker must consent. Reference transcript must
     * match reference audio exactly. Call on a background dispatcher, not UI thread.
     */
    @Synchronized
    fun synthesize(
        targetText: String,
        reference: FloatArray,
        referenceTranscript: String,
        languageSupportedByPack: Boolean,
        speakerConsented: Boolean
    ): GeneratedAudio {
        require(speakerConsented) { "Speaker authorization is required" }
        require(languageSupportedByPack) { "No matching offline language model installed" }
        require(targetText.isNotBlank() && targetText.length <= 800)
        require(referenceTranscript.trim().length in 3..2000)
        require(reference.size in (2*16000)..(12*16000))
        require(reference.all { it.isFinite() && it in -1.0f..1.0f })
        val opts = GenerationConfig(
            referenceAudio=reference,
            referenceSampleRate=16000,
            referenceText=referenceTranscript,
            numSteps=4
        )
        val generated=model.generateWithConfig(targetText,opts)
        require(generated.samples.isNotEmpty()) { "Local model produced no audio" }
        return generated
    }

    @Synchronized override fun close() { model.release() }
}
