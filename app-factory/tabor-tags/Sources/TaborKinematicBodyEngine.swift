// TABOR TAGS — By Nathan Tabor
// Prototype multi-tag biomechanics calculations; requires real sensor integration and validation.
// Original submission is preserved at docs/original-submission.txt.

import Foundation
import CoreBluetooth
import SwiftUI
import simd

// MARK: - Body & Equipment Node Locations

public enum KinematicNodeRole: String, CaseIterable, Identifiable {
    case pelvis      = "Pelvis / Belt"
    case torso       = "Chest / Lead Shoulder"
    case leadWrist   = "Lead Wrist / Forearm"
    case leadKnee    = "Lead Knee / Leg"
    case equipment   = "Club / Bat / Ball"
    
    public var id: String { rawValue }
    
    /// Ideal firing order index in an efficient athletic kinetic chain (1 = first, 4 = last)
    public var idealSequenceOrder: Int {
        switch self {
        case .leadKnee:  return 1
        case .pelvis:    return 2
        case .torso:     return 3
        case .leadWrist: return 4
        case .equipment: return 5
        }
    }
}

public struct NodePeakTelemetry {
    public let role: KinematicNodeRole
    public let peakAngularVelocityRadSec: Double
    public let timestampOfPeakSec: TimeInterval
    public let tiltAngleDegrees: Double
}

public struct KinematicEfficiencyReport {
    public let sportName: String
    public let efficiencyScore: Int              // 0 to 100% mechanical efficiency
    public let firingOrderActual: [KinematicNodeRole]
    public let isSequenceOptimal: Bool
    public let xFactorSeparationDeg: Double      // Peak hip-to-shoulder torque angle
    public let primaryBottleneck: String         // Where energy leaked
    public let coachingAdjustment: String        // Plain-English actionable fix
}

// MARK: - Multi-Tag Synchronized Biomechanics Engine

public final class TaborKinematicBodyEngine: ObservableObject {
    
    // Maps connected BLE peripheral UUIDs to assigned body joints or equipment
    @Published public var assignedNodes: [UUID: KinematicNodeRole] = [:]
    @Published public var latestReport: KinematicEfficiencyReport?
    @Published public var liveEfficiencyScore: Int = 0
    
    // Rolling peak capture per motion rep (windowed across 1.5s athletic motion)
    private var activeRepPeaks: [KinematicNodeRole: NodePeakTelemetry] = [:]
    private var repStartTime: TimeInterval = 0
    private var isCapturingRep: Bool = false
    
    public init() {}
    
    // MARK: - Tag Assignment
    
    public func assignTag(_ peripheralID: UUID, to role: KinematicNodeRole) {
        assignedNodes[peripheralID] = role
    }
    
    // MARK: - Multi-Node Telemetry Ingestion (Called at 100Hz per connected Tabor Tag)
    
    public func ingestNodeSample(peripheralID: UUID,
                                 accelG: SIMD3<Double>,
                                 gyroRadSec: SIMD3<Double>,
                                 pitchDeg: Double,
                                 timestamp: TimeInterval) {
        guard let role = assignedNodes[peripheralID] else { return }
        
        let angularSpeed = simd_length(gyroRadSec)
        let linearAccel = simd_length(accelG)
        
        // Trigger rep capture window when any node exceeds athletic initiation threshold
        if !isCapturingRep && (angularSpeed > 3.2 || linearAccel > 1.8) {
            isCapturingRep = true
            repStartTime = timestamp
            activeRepPeaks.removeAll()
        }
        
        guard isCapturingRep else { return }
        
        // Track peak rotational velocity and timestamp for each body segment
        if let existing = activeRepPeaks[role] {
            if angularSpeed > existing.peakAngularVelocityRadSec {
                activeRepPeaks[role] = NodePeakTelemetry(
                    role: role,
                    peakAngularVelocityRadSec: angularSpeed,
                    timestampOfPeakSec: timestamp,
                    tiltAngleDegrees: pitchDeg
                )
            }
        } else {
            activeRepPeaks[role] = NodePeakTelemetry(
                role: role,
                peakAngularVelocityRadSec: angularSpeed,
                timestampOfPeakSec: timestamp,
                tiltAngleDegrees: pitchDeg
            )
        }
        
        // Finalize & grade the full-body kinetic chain 450ms after initiation
        if (timestamp - repStartTime) >= 0.45 {
            isCapturingRep = false
            let report = evaluateKinematicChain(for: "Full-Body Athletic Motion")
            DispatchQueue.main.async {
                self.latestReport = report
                self.liveEfficiencyScore = report.efficiencyScore
            }
        }
    }
    
    // MARK: - Kinematic Sequence & Energy Transfer Solver
    
    public func evaluateKinematicChain(for sport: String) -> KinematicEfficiencyReport {
        // Sort captured nodes chronologically by the exact millisecond each reached peak speed
        let sortedByTime = activeRepPeaks.values.sorted { $0.timestampOfPeakSec < $1.timestampOfPeakSec }
        let actualOrder = sortedByTime.map { $0.role }
        
        // Check if body segments fired from ground up (Knee -> Pelvis -> Torso -> Wrist -> Equipment)
        var outOfOrderCount = 0
        for i in 1..<sortedByTime.count {
            if sortedByTime[i].role.idealSequenceOrder < sortedByTime[i - 1].role.idealSequenceOrder {
                outOfOrderCount += 1
            }
        }
        
        // Calculate X-Factor (Hip-to-Shoulder rotational separation)
        let pelvisPeak = activeRepPeaks[.pelvis]?.peakAngularVelocityRadSec ?? 6.0
        let torsoPeak = activeRepPeaks[.torso]?.peakAngularVelocityRadSec ?? 8.5
        let wristPeak = activeRepPeaks[.leadWrist]?.peakAngularVelocityRadSec ?? 14.0
        
        let velocityGainRatio = wristPeak / max(pelvisPeak, 1.0)
        let xFactorDeg = min(65.0, max(12.0, abs(torsoPeak - pelvisPeak) * 6.5))
        
        // Score mechanical efficiency (100 = textbook ground-up energy multiplication)
        var score = 96 - (outOfOrderCount * 14)
        if velocityGainRatio < 1.8 { score -= 12 } // Poor whip/lag transfer
        score = max(35, min(100, score))
        
        // Diagnose exact energy leak and generate actionable fix
        let bottleneck: String
        let advice: String
        
        if let wristTime = activeRepPeaks[.leadWrist]?.timestampOfPeakSec,
           let pelvisTime = activeRepPeaks[.pelvis]?.timestampOfPeakSec,
           wristTime < pelvisTime {
            let earlyMs = Int((pelvisTime - wristTime) * 1000.0)
            bottleneck = "Early Wrist Release (\(earlyMs)ms ahead of hips)"
            advice = "Initiate the move with your hips and belt buckle first—your hands fired \(earlyMs)ms early, leaking rotational power."
        } else if velocityGainRatio < 1.8 {
            bottleneck = "Low Whip Multiplication (Ratio: \(String(format: "%.1fx", velocityGainRatio)))"
            advice = "Brace your lead leg firmly at release so lower-body momentum snaps cleanly up into your torso and wrist."
        } else if let torsoTilt = activeRepPeaks[.torso]?.tiltAngleDegrees, abs(torsoTilt) > 38.0 {
            bottleneck = "Excessive Spine Tilt (\(Int(abs(torsoTilt)))°)"
            advice = "Keep your chest posture tall through impact—excessive spine tilt pulled your swing/release off plane."
        } else {
            bottleneck = "Optimal Ground-Up Energy Transfer"
            advice = "Textbook sequence: hips, torso, and wrist fired in order with \(String(format: "%.1fx", velocityGainRatio)) speed multiplication."
        }
        
        return KinematicEfficiencyReport(
            sportName: sport,
            efficiencyScore: score,
            firingOrderActual: actualOrder,
            isSequenceOptimal: outOfOrderCount == 0,
            xFactorSeparationDeg: xFactorDeg,
            primaryBottleneck: bottleneck,
            coachingAdjustment: advice
        )
    }
}

// MARK: - Athlete Biomechanics HUD & Coaching Card

public struct AthleteBiomechanicsView: View {
    @ObservedObject public var kinematicEngine: TaborKinematicBodyEngine
    @ObservedObject public var bleManager: TactileBLEPropManager
    
    public init(kinematicEngine: TaborKinematicBodyEngine, bleManager: TactileBLEPropManager) {
        self.kinematicEngine = kinematicEngine
        self.bleManager = bleManager
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Image(systemName: "figure.strengthtraining.functional")
                    .foregroundColor(.cyan)
                    .font(.title2)
                VStack(alignment: .leading) {
                    Text("TABOR KINEMATIC BODY LAB")
                        .font(.subheadline.bold())
                    Text("Multi-Tag Joint Mapping & Efficiency Coaching")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                Spacer()
                Text("\(kinematicEngine.liveEfficiencyScore)% EFF")
                    .font(.system(.headline, design: .monospaced, weight: .black))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.cyan.opacity(0.2), in: Capsule())
                    .foregroundColor(.cyan)
            }
            
            // Active Body Tag Status Pills
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(KinematicNodeRole.allCases) { role in
                        let isMapped = kinematicEngine.assignedNodes.values.contains(role)
                        HStack(spacing: 4) {
                            Circle()
                                .fill(isMapped ? Color.green : Color.gray)
                                .frame(width: 8, height: 8)
                            Text(role.rawValue)
                                .font(.caption2.bold())
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.white.opacity(0.08), in: Capsule())
}
}
}
// Live Coaching Feedback Box
if let report = kinematicEngine.latestReport {
VStack(alignment: .leading, spacing: 6) {
Text("BOTTLENECK: \(report.primaryBottleneck)")
.font(.caption.bold())
.foregroundColor(report.isSequenceOptimal ? .green : .orange)
Text(report.coachingAdjustment)
.font(.footnote)
.foregroundColor(.white)
Text("Firing Order: \(report.firingOrderActual.map { $0.rawValue }.joined(separator: " → "))")
.font(.caption2.monospaced())
.foregroundColor(.secondary)
}
.padding(12)
.background(Color.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 12))
} else {
Text("Clip Tabor Tags to your belt, chest, wrist, knee, and club/ball—then perform a full swing or throw.")
.font(.caption)
.foregroundColor(.secondary)
}
}
.padding()
.background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
.padding(.horizontal)
}
}
