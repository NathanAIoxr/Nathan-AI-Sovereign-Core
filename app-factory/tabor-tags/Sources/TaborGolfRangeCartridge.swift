// TABOR TAGS — By Nathan Tabor
// Prototype integration requires TactileBLEPropManager and UnifiedThrowVector.
// Original submission is preserved at docs/original-submission.txt.

import Foundation
import SwiftUI
import SceneKit
import simd

// MARK: - Golf Club Bag Specifications

public enum GolfClubType: String, CaseIterable, Identifiable {
    case driver      = "Driver (10.5°)"
    case threeWood   = "3-Wood (15°)"
    case fiveIron    = "5-Iron (27°)"
    case sevenIron   = "7-Iron (34°)"
    case pitchingWdg = "Pitching Wedge (46°)"
    case sandWedge   = "Sand Wedge (56°)"
    case putter      = "Putter (3°)"
    
    public var id: String { rawValue }
    
    /// Shaft length (meters), static loft (degrees), and smash factor for ball speed conversion
    public var specs: (shaftMeters: Double, baseLoftDeg: Double, smashFactor: Double) {
        switch self {
        case .driver:      return (1.14, 10.5, 1.48)
        case .threeWood:   return (1.09, 15.0, 1.44)
        case .fiveIron:    return (0.96, 27.0, 1.36)
        case .sevenIron:   return (0.94, 34.0, 1.32)
        case .pitchingWdg: return (0.90, 46.0, 1.24)
        case .sandWedge:   return (0.89, 56.0, 1.15)
        case .putter:      return (0.88,  3.0, 1.05)
        }
    }
}

// MARK: - Shot Telemetry & Ball-Flight Output

public struct GolfShotTelemetry {
    public let club: GolfClubType
    public let clubheadSpeedMPH: Double
    public let ballSpeedMPH: Double
    public let launchAngleDeg: Double
    public let sideSpinRPM: Double       // Negative = Draw/Hook, Positive = Fade/Slice
    public let backSpinRPM: Double
    public let carryYards: Double
    public let totalYards: Double
    public let offlineYards: Double      // Left (-) or Right (+) dispersion
    public let shotShapeLabel: String    // e.g., "Baby Draw", "Power Fade", "Dead Straight"
}

// MARK: - Golf Swing Physics Solver

public final class TaborGolfRangeEngine: ObservableObject {
    @Published public var selectedClub: GolfClubType = .driver
    @Published public var lastShot: GolfShotTelemetry?
    @Published public var shotHistory: [GolfShotTelemetry] = []
    @Published public var targetPinYards: Double = 250.0
    
    public init() {}
    
    /// Converts a UnifiedThrowVector from the Tabor Tag (or phone swing) into real golf ball flight
    public func processGolfSwing(from vector: UnifiedThrowVector) -> GolfShotTelemetry {
        let specs = selectedClub.specs
        
        // 1. Clubhead Speed (MPH) scaled by shaft lever arm and swing intensity
        let rawSpeedScale = max(0.15, min(1.25, vector.launchSpeedNormalized))
        let maxClubMPH: Double = (selectedClub == .putter) ? 18.0 : 118.0
        let clubSpeedMPH = rawSpeedScale * maxClubMPH * (specs.shaftMeters / 1.14)
        
        // 2. Ball Speed (MPH)
        let ballSpeedMPH = clubSpeedMPH * specs.smashFactor
        
        // 3. Dynamic Launch Angle & Spin Rates
        let dynamicLoft = max(2.0, specs.baseLoftDeg + (vector.loftAngleDegrees * 0.18))
        let sideSpin = vector.lateralHookTorque * (selectedClub == .putter ? 50.0 : 1450.0)
        let backSpin = (selectedClub == .putter)
            ? 120.0
            : max(1800.0, (specs.baseLoftDeg * 165.0) + (clubSpeedMPH * 18.0))
        
        // 4. Carry & Total Distance Calculation (Yards)
        let carryYards: Double
        let totalYards: Double
        
        if selectedClub == .putter {
            carryYards = 0.0
            totalYards = max(1.0, (ballSpeedMPH * 1.45)) // Converts to green roll distance in yards (multiply x3 for feet)
        } else {
            let loftEfficiency = sin(2.0 * dynamicLoft * (.pi / 180.0))
            let aerodynamicCarry = (pow(ballSpeedMPH, 1.72) * max(0.35, loftEfficiency)) * 0.088
            carryYards = min(345.0, max(15.0, aerodynamicCarry))
            
            // Lower loft clubs get more fairway rollout; wedges bite and stop
            let rollRatio = max(0.02, (48.0 - specs.baseLoftDeg) / 160.0)
            totalYards = carryYards * (1.0 + rollRatio)
        }
        
        // 5. Lateral Curve & Shot Shape Classification
        let offlineYards = (sideSpin / 1450.0) * (totalYards * 0.14)
        let shapeLabel: String
        if abs(offlineYards) < 4.0 {
            shapeLabel = "Pure Straight"
        } else if offlineYards < -15.0 {
            shapeLabel = "Hard Hook"
        } else if offlineYards < 0 {
            shapeLabel = "Tight Draw"
        } else if offlineYards > 15.0 {
            shapeLabel = "High Slice"
        } else {
            shapeLabel = "Controlled Fade"
        }
        
        let telemetry = GolfShotTelemetry(
            club: selectedClub,
            clubheadSpeedMPH: clubSpeedMPH,
            ballSpeedMPH: ballSpeedMPH,
            launchAngleDeg: dynamicLoft,
            sideSpinRPM: sideSpin,
            backSpinRPM: backSpin,
            carryYards: carryYards,
            totalYards: totalYards,
            offlineYards: offlineYards,
            shotShapeLabel: shapeLabel
        )
        
        DispatchQueue.main.async {
            self.lastShot = telemetry
            self.shotHistory.insert(telemetry, at: 0)
        }
        
        return telemetry
    }
}

// MARK: - Private Driving Range SwiftUI HUD & 3D Tracer View

public struct PrivateGolfRangeView: View {
    @StateObject private var golfEngine = TaborGolfRangeEngine()
    @ObservedObject public var bleManager: TactileBLEPropManager
    @State private var rangeScene = SCNScene()
    @State private var ballNode = SCNNode()
    
    public init(bleManager: TactileBLEPropManager) {
        self.bleManager = bleManager
    }
    
    public var body: some View {
        ZStack(alignment: .bottom) {
            // 3D Fairway & Ball-Flight Tracer Canvas
            SceneView(scene: rangeScene, options: [.autoenablesDefaultLighting])
                .ignoresSafeArea()
            
            VStack(spacing: 12) {
                // Top Club Selector & Tag Status Bar
                HStack {
                    Image(systemName: "figure.golf")
                        .foregroundColor(.green)
                        .font(.title2)
                    
                    Picker("Club", selection: $golfEngine.selectedClub) {
                        ForEach(GolfClubType.allCases) { club in
                            Text(club.rawValue).tag(club)
                        }
                    }
                    .pickerStyle(.menu)
                    .tint(.white)
                    
                    Spacer()
                    
                    Text(bleManager.connectedProp != nil ? "Tabor Tag Synced" : "Phone Swing Ready")
                        .font(.caption.bold())
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(bleManager.connectedProp != nil ? Color.green.opacity(0.8) : Color.orange.opacity(0.8), in: Capsule())
                        .foregroundColor(.white)
                }
                .padding(12)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14))
                
                Spacer()
                
                // Launch Monitor Readout Card (Carry, Total, Club Speed, Ball Shape)
                if let shot = golfEngine.lastShot {
                    VStack(spacing: 8) {
                        HStack {
                            Text(shot.shotShapeLabel.uppercased())
                                .font(.caption.bold())
                                .foregroundColor(.green)
                            Spacer()
                            Text(shot.club.rawValue)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        HStack(spacing: 18) {
                            MetricBox(title: "CARRY", value: String(format: "%.0f yds", shot.carryYards))
                            MetricBox(title: "TOTAL", value: String(format: "%.0f yds", shot.totalYards))
                            MetricBox(title: "CLUB SPD", value: String(format: "%.0f mph", shot.clubheadSpeedMPH))
                            MetricBox(title: "BALL SPD", value: String(format: "%.0f mph", shot.ballSpeedMPH))
                        }
                    }
                    .padding()
                    .background(Color.black.opacity(0.82), in: RoundedRectangle(cornerRadius: 16))
                    .foregroundColor(.white)
                } else {
                    Text("Attach Tabor Tag to your club shaft & take a smooth swing!")
                        .font(.subheadline.bold())
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.black.opacity(0.75), in: Capsule())
                }
            }
            .padding()
        }
        .onAppear {
            setupDrivingRangeScene()
            bleManager.onPropThrowDetected = { vector, _ in
                let shot = golfEngine.processGolfSwing(from: vector)
                animateBallTracer(for: shot)
            }
        }
    }
    
    private func setupDrivingRangeScene() {
        rangeScene.background.contents = UIColor(red: 0.12, green: 0.25, blue: 0.42, alpha: 1.0)
        
        // Fairway Turf
        let turf = SCNFloor()
        turf.firstMaterial?.diffuse.contents = UIColor(red: 0.13, green: 0.48, blue: 0.18, alpha: 1.0)
        rangeScene.rootNode.addChildNode(SCNNode(geometry: turf))
        
        // Yardage Target Flags (100, 150, 200, 250 yds)
        for yds in [100, 150, 200, 250] {
            let marker = SCNBox(width: 2.5, height: 0.1, length: 1.0, chamferRadius: 0)
            marker.firstMaterial?.diffuse.contents = UIColor.white
            let node = SCNNode(geometry: marker)
            node.position = SCNVector3(0, 0.05, -Float(yds) * 0.4)
            rangeScene.rootNode.addChildNode(node)
        }
        
        // Golf Ball
        let sphere = SCNSphere(radius: 0.08)
sphere.firstMaterial?.diffuse.contents = UIColor.white
ballNode = SCNNode(geometry: sphere)
ballNode.position = SCNVector3(0, 0.1, 0)
rangeScene.rootNode.addChildNode(ballNode)
// Tee-Box Camera
let cam = SCNNode()
cam.camera = SCNCamera()
cam.position = SCNVector3(0, 1.5, 2.8)
cam.look(at: SCNVector3(0, 1.0, -40))
rangeScene.rootNode.addChildNode(cam)
}
private func animateBallTracer(for shot: GolfShotTelemetry) {
ballNode.removeAllActions()
ballNode.position = SCNVector3(0, 0.1, 0)
let targetZ = -Float(shot.totalYards) * 0.4
let targetX = Float(shot.offlineYards) * 0.4
let apexY = (shot.club == .putter) ? 0.1 : Float(max(2.0, shot.carryYards * 0.08))
let rise = SCNAction.move(to: SCNVector3(targetX * 0.5, apexY, targetZ * 0.55), duration: 1.1)
rise.timingMode = .easeOut
let drop = SCNAction.move(to: SCNVector3(targetX, 0.1, targetZ), duration: 1.1)
drop.timingMode = .easeIn
ballNode.runAction(SCNAction.sequence([rise, drop]))
}
}
private struct MetricBox: View {
let title: String
let value: String
var body: some View {
VStack(spacing: 4) {
Text(title)
.font(.caption2)
.foregroundColor(.gray)
Text(value)
.font(.system(.callout, design: .monospaced, weight: .bold))
}
}
}
