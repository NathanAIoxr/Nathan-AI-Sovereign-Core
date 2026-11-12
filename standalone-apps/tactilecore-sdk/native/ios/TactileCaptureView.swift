// TactileCoreSDK - iOS touch/motion adapter example
// Nathan Tabor wrist-flip controller design, Nov 12 2026.
// NOTE: Reference adapter. Not compiled/tested in Xcode within this deliverable.

import UIKit
import CoreMotion

public enum TactilePhase: String {
    case began, moved, ended, cancelled
}

public struct TactileContactSample {
    public let id: Int                 // Stable CONTACT ID, not actual finger identity
    public let xPoints: CGFloat        // Logical UIKit screen points, NOT millimeters
    public let yPoints: CGFloat        // y increases DOWN the view
    public let timeMilliseconds: Double
    public let phase: TactilePhase
}

/// Subclass or embed this UIView wherever the game accepts wrist-flip inputs.
/// Feed samples to the shared detector in chronological order.
public final class TactileCaptureView: UIView {
    public var onSample: ((TactileContactSample) -> Void)?
    private var touchIds: [ObjectIdentifier: Int] = [:]
    private var nextId = 1

    public override init(frame: CGRect) {
        super.init(frame: frame)
        isMultipleTouchEnabled = true
        isUserInteractionEnabled = true
    }

    public required init?(coder: NSCoder) {
        super.init(coder: coder)
        isMultipleTouchEnabled = true
        isUserInteractionEnabled = true
    }

    private func identifier(for touch: UITouch) -> Int {
        let key = ObjectIdentifier(touch)
        if let value = touchIds[key] { return value }
        let value = nextId
        nextId += 1
        touchIds[key] = value
        return value
    }

    private func send(_ touch: UITouch, phase: TactilePhase) {
        let point = touch.location(in: self)
        onSample?(TactileContactSample(
            id: identifier(for: touch),
            xPoints: point.x,
            yPoints: point.y,
            timeMilliseconds: touch.timestamp * 1000,
            phase: phase
        ))
    }

    public override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)
        for touch in touches { send(touch, phase: .began) }
    }

    public override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesMoved(touches, with: event)
        for touch in touches {
            // Coalesced touches can improve the 15-45 ms release-window estimate.
            let sequence = event?.coalescedTouches(for: touch) ?? [touch]
            for sample in sequence { send(sample, phase: .moved) }
        }
    }

    public override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesEnded(touches, with: event)
        for touch in touches {
            send(touch, phase: .ended)
            touchIds.removeValue(forKey: ObjectIdentifier(touch))
        }
    }

    public override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesCancelled(touches, with: event)
        for touch in touches {
            send(touch, phase: .cancelled)
            touchIds.removeValue(forKey: ObjectIdentifier(touch))
        }
    }
}

public struct TactileMotionSample {
    public let rotationXRadPerSec: Double
    public let rotationYRadPerSec: Double
    public let rotationZRadPerSec: Double
    public let accelerationX: Double
    public let accelerationY: Double
    public let accelerationZ: Double
    public let timeMilliseconds: Double
}

/// Use one motion manager; start/stop with the game screen's lifecycle.
public final class TactileMotionSource {
    private let manager = CMMotionManager()

    public func start() -> Bool {
        guard manager.isDeviceMotionAvailable else { return false }
        manager.deviceMotionUpdateInterval = 1.0 / 60.0
        manager.startDeviceMotionUpdates()
        return true
    }

    public func latest() -> TactileMotionSample? {
        guard let motion = manager.deviceMotion else { return nil }
        return TactileMotionSample(
            rotationXRadPerSec: motion.rotationRate.x,
            rotationYRadPerSec: motion.rotationRate.y,
            rotationZRadPerSec: motion.rotationRate.z,
            accelerationX: motion.userAcceleration.x,
            accelerationY: motion.userAcceleration.y,
            accelerationZ: motion.userAcceleration.z,
            timeMilliseconds: motion.timestamp * 1000
        )
    }

    public func stop() { manager.stopDeviceMotionUpdates() }
}
