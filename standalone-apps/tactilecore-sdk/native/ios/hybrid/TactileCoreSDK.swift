// TactileCoreSDK — HybridKineticEngine prototype
// Design, names, and reference architecture attributed to Nathan Tabor (user-designated IP), 2026-11-12.
// This is a prototype, not calibrated biomechanics or evidence of patent status.
// IMPORTANT: Keep the device in your hand; NEVER throw or release it.
import Foundation
import UIKit
import CoreMotion
import simd

public enum InputTriggerSource: String {
    case glassTouch = "GLASS_MULTI_DIGIT"
    case inAirKineticThrow = "IN_AIR_IMU_THROW"
    case inAirAirPattern = "IN_AIR_GEOMETRIC_TRACE"
}

public enum GripMode: String {
    case threeDigitTriangle = "MODE_WRIST_FLIP_TRIANGLE_3D"
    case twoDigitPinch = "MODE_WRIST_FLIP_PINCH_2D"
    case oneDigitSnap = "MODE_WRIST_FLIP_SNAP_1D"
    case multiTouchTen = "MODE_TEN_DIGIT_MATRIX"
    case inAirHandheld = "MODE_IN_AIR_HANDHELD_MOTION"
}

public enum AirGeometricShape: String {
    case circle = "SHAPE_CIRCLE_PROTECTION"
    case triangle = "SHAPE_TRIANGLE_BALANCE"
    case figureEight = "SHAPE_FIGURE_EIGHT_FLOW"
    case swishFlick = "SHAPE_SWISH_AND_FLICK"
    case unknown = "SHAPE_FREEFORM"
}

public enum LimbProfile {
    case hand(twitchBufferMs: Double = 14)
    case foot(twitchBufferMs: Double = 20)

    var guardMs: Double {
        switch self {
        case let .hand(ms), let .foot(ms): return max(0, ms)
        }
    }
}

public struct TouchSample {
    public let timestampMs: Double
    public let positionPoints: SIMD2<Double>
    public let forceNormalized: Double // UIScreen finger pressure is generally unsupported.
}

public struct UnifiedThrowVector {
    public let source: InputTriggerSource
    public let gripUsed: GripMode
    public let velocityPointsPerMs: SIMD2<Double>
    // Only available after user/device calibration; not a hardware PPI guarantee.
    public let velocityMMPerMs: SIMD2<Double>?
    public let launchSpeedNormalized: Double
    public let loftAngleDegrees: Double
    public let axialSpinRPM: Double // Game parameter, NOT measured projectile RPM.
    public let lateralHookTorque: Double
    public let pancakeBackspin: Double
    public let releaseCleanliness: Double
}

private struct TouchTrail {
    var samples: [TouchSample]
    var endedAtMs: Double?
}

private struct MotionTelemetry {
    let timestampMs: Double
    let accelX: Double
    let accelY: Double
    let accelZ: Double
    let gyroX: Double
    let gyroY: Double
    let gyroZ: Double
    let pitchRad: Double
}

@MainActor
public final class TactileCoreSDK {
    public var limbProfile: LimbProfile = .hand()
    /// Supply points-per-mm from a real user/device calibration if required.
    public var pointsPerMillimeter: Double?
    public var onLateralStanceMoved: ((Double) -> Void)?
    public var onThrowReleased: ((UnifiedThrowVector) -> Void)?
    public var onAirPatternRecognized: ((AirGeometricShape, [SIMD2<Double>]) -> Void)?
    public var onLiveCursorMoved: ((SIMD2<Double>) -> Void)?
    public var onStatus: ((String) -> Void)?

    private var trails: [ObjectIdentifier: TouchTrail] = [:]
    private var activeIDs: Set<ObjectIdentifier> = []
    private var anchorID: ObjectIdentifier?
    private var controlIDs: [ObjectIdentifier] = []
    private var maximumGripCount = 0
    private var releaseStartMs: Double?
    private var invalidReleaseOrder = false
    private let bufferHistoryMs = 250.0
    private let releaseWindowMs = 65.0 // Real hardware can vary; adjustable after testing.
    private var stanceXPoints = 0.0

    private let motionManager = CMMotionManager()
    private let motionQueue: OperationQueue = {
        let queue = OperationQueue()
        queue.name = "com.tactilecore.hybrid.imu"
        queue.maxConcurrentOperationCount = 1
        return queue
    }()
    private var motionMode: InputTriggerSource = .glassTouch
    private var isAirThrowArmed = false
    private var isPatternTracing = false
    private var peakAccelG = 0.0
    private var peakGyro = SIMD3<Double>.zero
    private var peakTimestampMs = 0.0
    private var lastAirShotMs = -Double.infinity
    private var airTracePoints: [SIMD2<Double>] = []
    private var lastTraceTimestampMs: Double?

    public init(pointsPerMillimeter: Double? = nil) {
        if let p = pointsPerMillimeter, p > 0 { self.pointsPerMillimeter = p }
    }

    // MARK: Multi-touch — stable touch identity, staged release, guarded velocity
    public func touchesBegan(_ touches: Set<UITouch>, in view: UIView) {
        if activeIDs.isEmpty { clearGrip() }
        for touch in touches where activeIDs.count < 10 {
            let id = ObjectIdentifier(touch)
            let sample = makeSample(touch, view)
            activeIDs.insert(id)
            trails[id] = TouchTrail(samples: [sample], endedAtMs: nil)
        }
        classifyGripTopology()
    }

    public func touchesMoved(_ touches: Set<UITouch>, in view: UIView) {
        for touch in touches {
            let id = ObjectIdentifier(touch)
            guard activeIDs.contains(id) else { continue }
            appendSample(makeSample(touch, view), id: id)
            if id == anchorID, let samples = trails[id]?.samples, samples.count >= 2,
               releaseStartMs == nil {
                let dx = samples[samples.count - 1].positionPoints.x - samples[samples.count - 2].positionPoints.x
                stanceXPoints += dx
                onLateralStanceMoved?(stanceXPoints)
            }
        }
    }

    public func touchesEnded(_ touches: Set<UITouch>, in view: UIView) {
        // Handle the entire UIKit event as a batch; Set iteration order is arbitrary.
        let endings = touches.map { (ObjectIdentifier($0), makeSample($0, view)) }
        for (id, sample) in endings where activeIDs.contains(id) {
            appendSample(sample, id: id)
            trails[id]?.endedAtMs = sample.timestampMs
        }
        // The anchor must lift before or in the same UIKit event as control contacts.
        if maximumGripCount >= 2, releaseStartMs == nil,
           let anchor = anchorID,
           !endings.contains(where: { $0.0 == anchor }),
           endings.contains(where: { controlIDs.contains($0.0) }) {
            invalidReleaseOrder = true
        }
        if let anchor = anchorID,
           let anchorEnd = endings.first(where: { $0.0 == anchor })?.1.timestampMs,
           maximumGripCount >= 2, releaseStartMs == nil {
            releaseStartMs = anchorEnd
        }
        for (id, _) in endings { activeIDs.remove(id) }
        guard !activeIDs.isEmpty else {
            // Single touch always releases. Multiple touch needs anchor release.
            if maximumGripCount == 1 || (releaseStartMs != nil && !invalidReleaseOrder) { finalizeGlassThrow() }
            clearGrip()
            return
        }
        if let releaseStart = releaseStartMs,
           let latest = endings.map({ $0.1.timestampMs }).max(),
           latest - releaseStart > releaseWindowMs {
            if !invalidReleaseOrder { finalizeGlassThrow() }
            clearGrip()
        }
    }

    public func touchesCancelled(_ touches: Set<UITouch>, in view: UIView) {
        clearGrip() // System interruption should never emit a projectile.
        onStatus?("Touch sequence cancelled")
    }

    private func makeSample(_ touch: UITouch, _ view: UIView) -> TouchSample {
        let point = touch.location(in: view)
        return TouchSample(timestampMs: touch.timestamp * 1000,
                           positionPoints: SIMD2(Double(point.x), Double(view.bounds.height - point.y)),
                           forceNormalized: touch.maximumPossibleForce > 0
                           ? Double(touch.force / touch.maximumPossibleForce) : 0)
    }

    private func appendSample(_ sample: TouchSample, id: ObjectIdentifier) {
        guard var trail = trails[id] else { return }
        if let last = trail.samples.last, sample.timestampMs < last.timestampMs { return }
        trail.samples.append(sample)
        trail.samples.removeAll { sample.timestampMs - $0.timestampMs > bufferHistoryMs }
        trails[id] = trail
    }

    private func classifyGripTopology() {
        guard releaseStartMs == nil else { return }
        let ordered = activeIDs.compactMap { id -> (ObjectIdentifier, Double)? in
            guard let last = trails[id]?.samples.last else { return nil }
            return (id, last.positionPoints.y)
        }.sorted { $0.1 < $1.1 } // Y is UP: smallest Y is the bottom touch.
        guard !ordered.isEmpty else { return }
        if ordered.count < maximumGripCount { return }
        maximumGripCount = ordered.count
        anchorID = ordered.count == 1 ? nil : ordered[0].0
        controlIDs = (ordered.count == 1 ? [ordered[0].0] : ordered.dropFirst().map { $0.0 })
    }

    private func velocityFor(_ id: ObjectIdentifier, timeMs: Double) -> SIMD2<Double>? {
        guard let trail = trails[id] else { return nil }
        let endMs = min(timeMs, trail.endedAtMs ?? timeMs) - limbProfile.guardMs
        let valid = trail.samples.filter { $0.timestampMs <= endMs }
        guard valid.count >= 2, let end = valid.last else { return nil }
        let start = valid.last(where: { end.timestampMs - $0.timestampMs >= 35 }) ?? valid[0]
        let dt = end.timestampMs - start.timestampMs
        guard dt >= 1 else { return nil }
        return (end.positionPoints - start.positionPoints) / dt
    }

    private func finalizeGlassThrow() {
        guard !controlIDs.isEmpty else { return }
        let observations: [(ObjectIdentifier, SIMD2<Double>)] = controlIDs.compactMap { id in
            guard let endMs = trails[id]?.endedAtMs,
                  let velocity = velocityFor(id, timeMs: endMs) else { return nil }
            return (id, velocity)
        }
        guard !observations.isEmpty else { onStatus?("Not enough motion samples"); return }
        let average = observations.map { $0.1 }.reduce(SIMD2<Double>.zero, +) / Double(observations.count)
        let grip: GripMode = maximumGripCount >= 4 ? .multiTouchTen :
            maximumGripCount == 3 ? .threeDigitTriangle :
            maximumGripCount == 2 ? .twoDigitPinch : .oneDigitSnap
        let speedDiff = observations.count >= 2 ? observations[0].1.y - observations[1].1.y : 0
        let torque = clamp(speedDiff * 0.85 + average.x * 0.2, -1, 1)
        let asymmetry = abs(speedDiff) / max(abs(average.y), 0.1)
        let cleanliness = clamp(1 - asymmetry * 0.5, 0.3, 1)
        let upwardSpeed = max(0, average.y)
        let power = clamp(upwardSpeed / 2.2, 0, 1.25)
        let vector = UnifiedThrowVector(
            source: .glassTouch, gripUsed: grip, velocityPointsPerMs: average,
            velocityMMPerMs: pointsPerMillimeter.map { average / $0 },
            launchSpeedNormalized: power,
            loftAngleDegrees: clamp(upwardSpeed * 16, 5, 48),
            axialSpinRPM: abs(torque) * 450 + upwardSpeed * 120,
            lateralHookTorque: torque,
            pancakeBackspin: clamp(upwardSpeed * 0.45 * cleanliness, 0, 1),
            releaseCleanliness: cleanliness)
        onThrowReleased?(vector)
    }

    private func clearGrip() {
        trails.removeAll()
        activeIDs.removeAll()
        anchorID = nil
        controlIDs.removeAll()
        maximumGripCount = 0
        releaseStartMs = nil
        invalidReleaseOrder = false
        stanceXPoints = 0
    }

    private func clamp(_ x: Double, _ minValue: Double, _ maxValue: Double) -> Double {
        Swift.max(minValue, Swift.min(maxValue, x))
    }

    // MARK: CoreMotion — deliberate, handheld, on-screen armed gesture only
    public func startInAirSensors(mode: InputTriggerSource) {
        stopInAirSensors()
        guard mode != .glassTouch else { return }
        guard motionManager.isDeviceMotionAvailable else {
            onStatus?("CoreMotion is unavailable; use the glass touch mode")
            return
        }
        motionMode = mode
        peakAccelG = 0
        peakTimestampMs = 0
        airTracePoints = []
        lastTraceTimestampMs = nil
        motionManager.deviceMotionUpdateInterval = 0.01 // Requested 100 Hz, not guaranteed.
        motionManager.startDeviceMotionUpdates(using: .xArbitraryZVertical, to: motionQueue) { [weak self] motion, error in
            guard let motion = motion else { return }
            let a = motion.userAcceleration, r = motion.rotationRate
            let reading = MotionTelemetry(timestampMs: motion.timestamp * 1000,
                    accelX: a.x, accelY: a.y, accelZ: a.z,
                    gyroX: r.x, gyroY: r.y, gyroZ: r.z,
                    pitchRad: motion.attitude.pitch)
            DispatchQueue.main.async { [weak self] in self?.ingestMotion(reading) }
        }
    }

    public func stopInAirSensors() {
        motionManager.stopDeviceMotionUpdates()
        isAirThrowArmed = false
        isPatternTracing = false
        peakAccelG = 0
        airTracePoints = []
    }

    /// This MUST be set only while a thumb presses an on-screen hold-to-arm surface.
    public func setInAirArmed(_ armed: Bool) {
        isAirThrowArmed = armed && motionMode == .inAirKineticThrow && motionManager.isDeviceMotionActive
        peakAccelG = 0
        peakGyro = .zero
        peakTimestampMs = 0
    }

    /// Capture rotation gestures only while user holds the TRACE control.
    public func setPatternTracing(_ tracing: Bool) {
        guard motionMode == .inAirAirPattern, motionManager.isDeviceMotionActive else { return }
        if tracing {
            airTracePoints = [.zero]
            lastTraceTimestampMs = nil
            isPatternTracing = true
        } else if isPatternTracing {
            isPatternTracing = false
            let points = airTracePoints
            let result = Self.classifyGeometricPath(points)
            onAirPatternRecognized?(result, points)
            airTracePoints = []
        }
    }

    private func ingestMotion(_ motion: MotionTelemetry) {
        guard motionManager.isDeviceMotionActive else { return }
        if motionMode == .inAirKineticThrow && isAirThrowArmed {
            // Accelerometer magnitude provides an ARCADE power estimate, not physical pitch MPH.
            let accelG = hypot(motion.accelY, motion.accelZ)
            if accelG > peakAccelG {
                peakAccelG = accelG
                peakGyro = SIMD3(motion.gyroX, motion.gyroY, motion.gyroZ)
                peakTimestampMs = motion.timestampMs
            }
            let peakIsRecent = motion.timestampMs - peakTimestampMs < 250
            if peakAccelG > 0.75 && peakIsRecent && accelG < peakAccelG * 0.45 &&
                motion.timestampMs - lastAirShotMs >= 900 {
                lastAirShotMs = motion.timestampMs
                isAirThrowArmed = false // Require a NEW user hold to re-arm.
                let power = clamp((peakAccelG - 0.3) / 2.5, 0.1, 1.25)
                let spin = clamp(hypot(peakGyro.x, peakGyro.y) * 240, 0, 2800)
                let torque = clamp(peakGyro.y / 8, -1, 1)
                let loft = clamp(motion.pitchRad * 180 / .pi * 0.6, -10, 35)
                let vector = UnifiedThrowVector(
                    source: .inAirKineticThrow, gripUsed: .inAirHandheld,
                    velocityPointsPerMs: SIMD2(torque * 0.8, power * 2.4),
                    velocityMMPerMs: nil, launchSpeedNormalized: power,
                    loftAngleDegrees: loft, axialSpinRPM: spin,
                    lateralHookTorque: torque, pancakeBackspin: clamp(-peakGyro.x / 7.5, 0, 1),
                    releaseCleanliness: 0.9)
                onThrowReleased?(vector)
                onStatus?("Virtual release detected — device remains in hand")
            }
        }
        if motionMode == .inAirAirPattern && isPatternTracing {
            let dt = clamp((motion.timestampMs - (lastTraceTimestampMs ?? motion.timestampMs)) / 1000, 0, 0.05)
            lastTraceTimestampMs = motion.timestampMs
            let previous = airTracePoints.last ?? .zero
            // Rotation projection, NOT true spatial XY displacement.
            let next = previous + SIMD2(-motion.gyroZ * dt * 100, motion.gyroX * dt * 100)
            airTracePoints.append(next)
            if airTracePoints.count > 600 { airTracePoints.removeFirst() }
            onLiveCursorMoved?(next)
        }
    }

    /// Heuristic outline classification on projected rotational motion (not world-space tracing).
    public static func classifyGeometricPath(_ points: [SIMD2<Double>]) -> AirGeometricShape {
        guard points.count >= 18, let first = points.first, let last = points.last else { return .unknown }
        let minX = points.map(\.x).min() ?? 0, maxX = points.map(\.x).max() ?? 0
        let minY = points.map(\.y).min() ?? 0, maxY = points.map(\.y).max() ?? 0
        let diagonal = hypot(maxX - minX, maxY - minY)
        guard diagonal >= 18 else { return .unknown }
        let closed = simd_distance(first, last) / diagonal < 0.32
        var corners = 0
        var turn = 0.0
        for i in 2..<points.count {
            let a = points[i-1] - points[i-2], b = points[i] - points[i-1]
            let la = simd_length(a), lb = simd_length(b)
            guard la > 0.4 && lb > 0.4 else { continue }
            let dot = simd_dot(a, b)
            turn += atan2(a.x * b.y - a.y * b.x, dot)
            if dot / (la * lb) < 0.35 { corners += 1 }
        }
        if closed {
            if abs(turn) < 1.8 { return .figureEight }
            return corners >= 2 ? .triangle : .circle
        }
        return last.y > first.y && minY < first.y ? .swishFlick : .unknown
    }
}
