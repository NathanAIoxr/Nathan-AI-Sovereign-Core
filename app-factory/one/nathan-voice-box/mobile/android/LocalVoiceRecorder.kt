package org.nathanai.voicebox

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import kotlin.math.max

/**
 * Explicit, in-memory audio capture. Call ONLY after a visible user tap and
 * runtime RECORD_AUDIO permission approval, on a dedicated IO thread.
 * Returns mono signed PCM float samples at 16 kHz. Nothing is uploaded or saved.
 */
object LocalVoiceRecorder {
    const val RATE = 16000
    private const val MAX_SECONDS = 45

    fun record(context: Context, seconds: Int, shouldStop: () -> Boolean): FloatArray {
        require(seconds in 2..MAX_SECONDS) { "Recording duration must be 2..45 seconds" }
        check(context.checkSelfPermission(Manifest.permission.RECORD_AUDIO)
            == PackageManager.PERMISSION_GRANTED) { "Microphone permission not granted" }
        val minBytes = AudioRecord.getMinBufferSize(
            RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT
        )
        check(minBytes > 0) { "16 kHz mono capture unsupported" }
        val record = AudioRecord(
            MediaRecorder.AudioSource.VOICE_RECOGNITION, RATE,
            AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT,
            max(minBytes, 3200) * 2
        )
        check(record.state == AudioRecord.STATE_INITIALIZED) { "Recorder unavailable" }
        val target = RATE * seconds
        val output = FloatArray(target)
        val buffer = ShortArray(max(1600, minBytes / 2))
        var index = 0
        try {
            record.startRecording()
            while (index < target && !shouldStop()) {
                val count = record.read(buffer, 0, minOf(buffer.size, target - index))
                if (count <= 0) break
                for (i in 0 until count) output[index++] = buffer[i] / 32768.0f
            }
        } finally {
            if (record.recordingState == AudioRecord.RECORDSTATE_RECORDING) record.stop()
            record.release()
        }
        return output.copyOf(index)
    }
}
