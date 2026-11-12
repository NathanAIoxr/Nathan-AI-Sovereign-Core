// TactileCoreSDK hybrid five-cartridge 3D prototyping arena (SceneKit compatibility).
// Design and implementation source attributed to Nathan Tabor, user-designated proprietary platform, 2026-11-12.
// SceneKit is deprecated by Apple (2025+). Use RealityKit for a long-term product.
// Keep device in hand AT ALL TIMES. Virtual in-air release does not release the phone.
import SwiftUI
import UIKit
import SceneKit
import Combine

public enum SportCartridge: String, CaseIterable, Identifiable {
    case baseballPitching = "Baseball"
    case tenPinBowling = "Bowling"
    case beanbagToss = "Cornhole"
    case pubDarts = "Darts"
    case airConductor = "Air Patterns"
    public var id: String { rawValue }
}

public struct UniversalPhysicsArenaView: View {
    @StateObject private var controller = ArenaController()
    @State private var cartridge: SportCartridge = .baseballPitching
    @State private var useAirMotion = false // Safe touch-only default.
    @State private var actionPressed = false

    public init() {}

    public var body: some View {
        ZStack(alignment: .top) {
            TactileSceneContainer(controller: controller)
                .ignoresSafeArea()
            VStack(spacing: 12) {
                Picker("Cartridge", selection: $cartridge) {
                    ForEach(SportCartridge.allCases) { game in Text(game.rawValue).tag(game) }
                }
                .pickerStyle(.menu)
                .tint(.white)
                .padding(12)
                .background(.black.opacity(0.8), in: RoundedRectangle(cornerRadius: 12))

                if cartridge == .baseballPitching {
                    Toggle("Handheld air motion", isOn: $useAirMotion)
                        .foregroundStyle(.white)
                        .padding(12)
                        .background(.black.opacity(0.8), in: RoundedRectangle(cornerRadius: 12))
                }

                Text(controller.statusBanner)
                    .font(.system(.footnote, design: .monospaced))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                    .padding(12)
                    .background(.black.opacity(0.8), in: RoundedRectangle(cornerRadius: 12))
                Spacer()

                if controller.requiresHoldControl {
                    Text(cartridge == .airConductor ? "HOLD TO TRACE IN AIR" : "HOLD TO ARM VIRTUAL PITCH")
                        .font(.system(.headline, design: .rounded))
                        .foregroundStyle(.black)
                        .padding(20)
                        .frame(maxWidth: .infinity)
                        .background(actionPressed ? Color.green : Color.cyan, in: RoundedRectangle(cornerRadius: 18))
                        .contentShape(Rectangle())
                        .gesture(DragGesture(minimumDistance: 0)
                            .onChanged { _ in
                                guard !actionPressed else { return }
                                actionPressed = true
                                controller.setHoldControl(true)
                            }
                            .onEnded { _ in
                                actionPressed = false
                                controller.setHoldControl(false)
                            })
                        .accessibilityLabel("Hold to control virtual gesture without releasing device")
                } else {
                    Text("Touch the arena: flick up with 1, 2, or 3 contacts")
                        .font(.footnote).foregroundStyle(.white)
                        .padding(12).background(.black.opacity(0.7), in: Capsule())
                }
                Text("NEVER THROW OR RELEASE YOUR PHONE")
                    .font(.caption2.bold()).foregroundStyle(.white)
            }
            .padding()
        }
        .onAppear { controller.loadCartridge(cartridge, inAirEnabled: useAirMotion) }
        .onDisappear { controller.stop() }
        .onChange(of: cartridge) { _, newValue in
            actionPressed = false
            controller.loadCartridge(newValue, inAirEnabled: useAirMotion)
        }
        .onChange(of: useAirMotion) { _, enabled in
            actionPressed = false
            controller.loadCartridge(cartridge, inAirEnabled: enabled)
        }
    }
}

@MainActor
public final class ArenaController: ObservableObject {
    public let sdk = TactileCoreSDK()
    public let scene = SCNScene()
    @Published public var statusBanner = "Ready — choose a cartridge"
    @Published public var requiresHoldControl = false
    private var activeCartridge: SportCartridge = .baseballPitching
    private var useAir = false
    private var projectile: SCNNode?
    private var target: SCNNode?
    private var environmentNodes: [SCNNode] = []
    private var stanceX = 0.0
    private var shotNumber = 0

    public init() {
        configureWorld()
        sdk.onLateralStanceMoved = { [weak self] dx in self?.stanceX = max(-0.7, min(0.7, dx / 180)) }
        sdk.onThrowReleased = { [weak self] vector in self?.launchProjectile(vector) }
        sdk.onAirPatternRecognized = { [weak self] shape, _ in
            self?.statusBanner = "Air pattern: \(shape.rawValue) (heuristic)"
        }
        sdk.onStatus = { [weak self] message in self?.statusBanner = message }
    }

    public func stop() { sdk.setInAirArmed(false); sdk.setPatternTracing(false); sdk.stopInAirSensors() }

    public func setHoldControl(_ down: Bool) {
        if activeCartridge == .airConductor { sdk.setPatternTracing(down) }
        else if activeCartridge == .baseballPitching && useAir { sdk.setInAirArmed(down) }
    }

    private func configureWorld() {
        scene.background.contents = UIColor(red: 0.05, green: 0.09, blue: 0.14, alpha: 1)
        let camera = SCNNode()
        camera.camera = SCNCamera()
        camera.position = SCNVector3(0, 2.6, 7)
        camera.look(at: SCNVector3(0, 1.1, -8))
        scene.rootNode.addChildNode(camera)
        let light = SCNNode()
        light.light = SCNLight()
        light.light?.type = .omni
        light.position = SCNVector3(1, 10, 5)
        scene.rootNode.addChildNode(light)
        let ambient = SCNNode()
        ambient.light = SCNLight()
        ambient.light?.type = .ambient
        ambient.light?.color = UIColor(white: 0.35, alpha: 1)
        scene.rootNode.addChildNode(ambient)
        let floor = SCNNode(geometry: SCNFloor())
        floor.geometry?.firstMaterial?.diffuse.contents = UIColor(red: 0.16, green: 0.22, blue: 0.24, alpha: 1)
        floor.physicsBody = .static()
        scene.rootNode.addChildNode(floor)
    }

    public func loadCartridge(_ cartridge: SportCartridge, inAirEnabled: Bool) {
        stop()
        activeCartridge = cartridge
        useAir = inAirEnabled
        projectile?.removeFromParentNode()
        target?.removeFromParentNode()
        environmentNodes.forEach { $0.removeFromParentNode() }
        environmentNodes.removeAll()
        shotNumber = 0
        requiresHoldControl = cartridge == .airConductor || (cartridge == .baseballPitching && useAir)
        switch cartridge {
        case .baseballPitching:
            spawnBox(SCNVector3(1.1, 1.4, 0.1), at: SCNVector3(0, 1.2, -17), color: .systemRed)
            if useAir { sdk.startInAirSensors(mode: .inAirKineticThrow) }
            statusBanner = useAir ? "Hold ARM and make a controlled wrist motion; keep device in hand" :
                "Baseball — use 1, 2 or 3 touch contacts to pitch"
        case .tenPinBowling:
            spawnBowlingPins()
            statusBanner = "Bowling — thumb-bottom two-finger-top flick (or single finger)"
        case .beanbagToss:
            spawnBox(SCNVector3(1.5, 0.12, 2.4), at: SCNVector3(0, 0.2, -8), color: .systemBlue)
            statusBanner = "Cornhole — upward release adds a game backspin parameter"
        case .pubDarts:
            spawnBox(SCNVector3(1.1, 1.1, 0.09), at: SCNVector3(0, 1.73, -4), color: .systemGreen)
            statusBanner = "Darts — pinch, aim, release on glass"
        case .airConductor:
            sdk.startInAirSensors(mode: .inAirAirPattern)
            statusBanner = "Hold TRACE and draw slow air-rotation patterns"
        }
    }

    private func spawnBox(_ size: SCNVector3, at pos: SCNVector3, color: UIColor) {
        let geo = SCNBox(width: CGFloat(size.x), height: CGFloat(size.y),
                         length: CGFloat(size.z), chamferRadius: 0.04)
        geo.firstMaterial?.diffuse.contents = color
        let node = SCNNode(geometry: geo)
        node.position = pos
        node.physicsBody = .static()
        scene.rootNode.addChildNode(node)
        target = node
    }

    private func spawnBowlingPins() {
        for row in 0..<4 {
            for col in 0...row {
                let pin = SCNNode(geometry: SCNCapsule(capRadius: 0.07, height: 0.36))
                pin.position = SCNVector3(Float(col) * 0.28 - Float(row) * 0.14,
                                          0.18, -13 - Float(row) * 0.3)
                pin.geometry?.firstMaterial?.diffuse.contents = UIColor.white
                pin.physicsBody = .dynamic()
                pin.physicsBody?.mass = 1.5
                scene.rootNode.addChildNode(pin)
                environmentNodes.append(pin)
            }
        }
    }

    private func launchProjectile(_ vector: UnifiedThrowVector) {
        guard activeCartridge != .airConductor else { return }
        projectile?.removeFromParentNode()
        let bowling = activeCartridge == .tenPinBowling
        let radius: CGFloat = bowling ? 0.13 : activeCartridge == .beanbagToss ? 0.10 : 0.05
        let geo = SCNSphere(radius: radius) // Simplified visuals, not real bag/dart meshes.
        geo.firstMaterial?.diffuse.contents = UIColor.systemOrange
        let ball = SCNNode(geometry: geo)
        ball.position = SCNVector3(Float(stanceX), bowling ? Float(radius) : 1.25, 3)
        let physics = SCNPhysicsBody.dynamic()
        physics.mass = bowling ? 6.8 : activeCartridge == .beanbagToss ? 0.45 : 0.145
        physics.isAffectedByGravity = !bowling
        let angle = Float(vector.loftAngleDegrees * .pi / 180)
        let speed = Float(max(0.1, vector.launchSpeedNormalized)) * (bowling ? 10 : 20)
        physics.velocity = SCNVector3(Float(vector.lateralHookTorque) * 2,
                                      bowling ? 0 : sin(angle) * speed * 0.5,
                                      -cos(angle) * speed)
        physics.angularVelocity = SCNVector4(0, 1, 0, Float(vector.axialSpinRPM / 60))
        ball.physicsBody = physics
        scene.rootNode.addChildNode(ball)
        projectile = ball
        shotNumber += 1
        statusBanner = "#\(shotNumber) \(vector.gripUsed.rawValue) · power \(Int(vector.launchSpeedNormalized * 100))% · simulated spin \(Int(vector.axialSpinRPM))"
    }
}

private struct TactileSceneContainer: UIViewRepresentable {
    let controller: ArenaController
    func makeUIView(context: Context) -> TouchForwardingSCNView {
        let view = TouchForwardingSCNView(frame: .zero)
        view.scene = controller.scene
        view.allowsCameraControl = false
        view.isMultipleTouchEnabled = true
        view.backgroundColor = .black
        view.sdk = controller.sdk
        return view
    }
    func updateUIView(_ uiView: TouchForwardingSCNView, context: Context) {}
}

private final class TouchForwardingSCNView: SCNView {
    weak var sdk: TactileCoreSDK?
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) { sdk?.touchesBegan(touches, in: self) }
    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        if let coalesced = event {
            // UIKit may provide intermediate points; engine sorts by timestamp.
            for touch in touches {
                let samples = coalesced.coalescedTouches(for: touch) ?? [touch]
                for s in samples { sdk?.touchesMoved([s], in: self) }
            }
        } else { sdk?.touchesMoved(touches, in: self) }
    }
    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) { sdk?.touchesEnded(touches, in: self) }
    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) { sdk?.touchesCancelled(touches, in: self) }
}
