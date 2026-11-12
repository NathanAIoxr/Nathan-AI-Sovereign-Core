// TactileCoreSDK - Android input/motion adapter example
// Nathan Tabor wrist-flip controller design, Nov 12 2026.
// NOTE: Reference adapter. Not compiled/tested in Android Studio within this deliverable.

package com.tactilecore.sdk

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View

/** Pointer IDs identify contacts during a gesture, NOT biological fingers. */
enum class ContactPhase { BEGAN, MOVED, ENDED, CANCELLED }

data class ContactSample(
    val pointerId: Int,
    val xPixels: Float,
    val yPixels: Float,    // Android Y increases DOWN; bottommost is MAX Y
    val timeMilliseconds: Long,
    val phase: ContactPhase,
)

class TactileCaptureView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : View(context, attrs) {
    var onSample: ((ContactSample) -> Unit)? = null

    private fun emit(e: MotionEvent, index: Int, phase: ContactPhase, history: Int = -1) {
        val historical = history >= 0
        onSample?.invoke(ContactSample(
            pointerId = e.getPointerId(index),
            xPixels = if (historical) e.getHistoricalX(index, history) else e.getX(index),
            yPixels = if (historical) e.getHistoricalY(index, history) else e.getY(index),
            timeMilliseconds = if (historical) e.getHistoricalEventTime(history) else e.eventTime,
            phase = phase,
        ))
    }

    override fun onTouchEvent(e: MotionEvent): Boolean {
        when (e.actionMasked) {
            MotionEvent.ACTION_DOWN, MotionEvent.ACTION_POINTER_DOWN -> {
                emit(e, e.actionIndex, ContactPhase.BEGAN)
            }
            MotionEvent.ACTION_MOVE -> {
                for (history in 0 until e.historySize) {
                    for (index in 0 until e.pointerCount) {
                        emit(e, index, ContactPhase.MOVED, history)
                    }
                }
                for (index in 0 until e.pointerCount) emit(e, index, ContactPhase.MOVED)
            }
            MotionEvent.ACTION_POINTER_UP, MotionEvent.ACTION_UP -> {
                emit(e, e.actionIndex, ContactPhase.ENDED)
            }
            MotionEvent.ACTION_CANCEL -> {
                for (index in 0 until e.pointerCount) emit(e, index, ContactPhase.CANCELLED)
            }
        }
        return true
    }
}

/** Raw gyroscope sample; consumer handles axis, grip orientation, and calibration. */
data class RotationSample(val xRadPerSec: Float, val yRadPerSec: Float, val zRadPerSec: Float,
                          val timestampNanoseconds: Long)

class TactileMotionSource(context: Context, private val onRotation: (RotationSample) -> Unit) : SensorEventListener {
    private val manager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val gyro: Sensor? = manager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)

    fun start(): Boolean {
        val sensor = gyro ?: return false
        return manager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_GAME)
    }

    fun stop() { manager.unregisterListener(this) }

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type != Sensor.TYPE_GYROSCOPE) return
        onRotation(RotationSample(event.values[0], event.values[1], event.values[2], event.timestamp))
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
}
