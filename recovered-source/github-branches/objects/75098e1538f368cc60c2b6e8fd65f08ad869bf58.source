import Foundation

/// Player-controlled presentation timing. Never times out a child's answer.
/// Keep preference values stable to preserve saved settings across updates.
enum GamePace: String, CaseIterable, Identifiable {
    case calm
    case steady
    case quick

    var id: String { rawValue }

    var title: String {
        switch self {
        case .calm: return "Calm"
        case .steady: return "Steady"
        case .quick: return "Quick"
        }
    }

    var description: String {
        switch self {
        case .calm: return "Leave matching clues visible longer"
        case .steady: return "Comfortable everyday pace"
        case .quick: return "Shorter pauses between card turns"
        }
    }

    /// Seconds that a wrong pair remains face-up, never below a readable pause.
    var mismatchRevealSeconds: Double {
        switch self {
        case .calm: return 1.7
        case .steady: return 1.0
        case .quick: return 0.55
        }
    }

    /// Decorative animations only: gameplay advances exclusively after a tap.
    var animationSeconds: Double {
        switch self {
        case .calm: return 0.45
        case .steady: return 0.25
        case .quick: return 0.12
        }
    }

    static func restored(_ raw: String) -> GamePace {
        GamePace(rawValue: raw) ?? .steady
    }
}
