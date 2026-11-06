package org.nathanai.voicebox

import java.io.Closeable
import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * JNI wrapper over local audio DSP. Model inference remains a separate offline TTS engine.
 * Use only mono float PCM. Allocate the direct buffer outside the real-time audio callback.
 */
class EdgeDSP(sampleRate: Int, effect: Int) : Closeable {
    private var handle: Long = createNative(sampleRate, effect)

    init { check(handle != 0L) { "DSP initialization failed" } }

    /** Buffer must be direct, native byte order, and hold count float32 samples. */
    @Synchronized fun process(buffer: ByteBuffer, count: Int) {
        require(buffer.isDirect && buffer.order() == ByteOrder.nativeOrder())
        require(count >= 0 && count.toLong() * 4L <= buffer.capacity().toLong())
        check(handle != 0L) { "DSP already closed" }
        check(processNative(handle, buffer, count)) { "Invalid audio buffer" }
    }

    @Synchronized override fun close() {
        if (handle != 0L) { destroyNative(handle); handle = 0L }
    }

    private external fun createNative(sampleRate: Int, effect: Int): Long
    private external fun processNative(handle: Long, buffer: ByteBuffer, count: Int): Boolean
    private external fun destroyNative(handle: Long)

    companion object {
        const val CLEAN = 0
        const val CAVE = 1
        const val ECHO = 2
        const val WIND = 3
        init { System.loadLibrary("nathan_voicebox") }
    }
}
