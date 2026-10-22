import SwiftUI

private enum Palette {
    static let ink = Color(red: 0.13, green: 0.22, blue: 0.24)
    static let deep = Color(red: 0.10, green: 0.37, blue: 0.35)
    static let cream = Color(red: 1.00, green: 0.97, blue: 0.87)
    static let gold = Color(red: 0.95, green: 0.68, blue: 0.22)
}

struct GameBackground<Content: View>: View {
    let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }

    var body: some View {
        ZStack {
            LinearGradient(colors: [.init(red: 0.77, green: 0.94, blue: 0.84), Palette.cream], startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
            Circle().fill(Color.yellow.opacity(0.15)).frame(width: 280,height:280).blur(radius: 65).offset(x: 155,y: -250).allowsHitTesting(false)
            content
                .frame(maxWidth: 600)
                .frame(maxWidth: .infinity)
        }
        .foregroundStyle(Palette.ink)
    }
}

struct GameCard<Content: View>: View {
    let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }
    var body: some View {
        VStack(spacing: 12) { content }
            .padding(16)
            .frame(maxWidth: .infinity)
            .background(.white.opacity(0.92), in: RoundedRectangle(cornerRadius: 24))
            .overlay(RoundedRectangle(cornerRadius: 24).stroke(.brown.opacity(0.10), lineWidth: 1.5))
            .shadow(color: Palette.deep.opacity(0.12), radius: 16, y: 8)
    }
}

struct PawButton: View {
    let title: String
    let symbol: String
    let action: () -> Void

    var body: some View {
        Button { MammalHaptics.tap(); action() } label: {
            Label(title, systemImage: symbol)
                .font(.system(size: 17, weight: .heavy, design: .rounded))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .foregroundStyle(.white)
                .background(LinearGradient(colors: [Palette.deep, .teal], startPoint: .topLeading, endPoint: .bottomTrailing), in: RoundedRectangle(cornerRadius: 18))
        }
        .buttonStyle(.plain)
    }
}

struct StoryHeading: View {
    let title: String
    let subtitle: String
    var body: some View {
        VStack(spacing: 6) {
            Text(title)
                .font(.system(.title, design: .rounded, weight: .black))
                .fixedSize(horizontal: false, vertical: true)
                .multilineTextAlignment(.center)
            Text(subtitle)
                .font(.system(.subheadline, design: .rounded, weight: .medium))
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct StarCount: View {
    @EnvironmentObject private var progress: MammalProgress
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "star.fill")
                .foregroundStyle(.orange)
            Text("\(progress.stars)")
                .monospacedDigit()
        }
        .font(.system(.headline, design: .rounded, weight: .bold))
        .padding(.horizontal, 14)
        .padding(.vertical, 9)
        .background(.white.opacity(0.95), in: Capsule())
        .accessibilityLabel("\(progress.stars) stars collected")
    }
}

struct AwardBanner: View {
    let title: String
    var body: some View {
        Label(title, systemImage: "star.circle.fill")
            .font(.system(.headline, design: .rounded, weight: .bold))
            .foregroundStyle(.brown)
            .padding(14)
            .frame(maxWidth: .infinity)
            .background(.yellow.opacity(0.25), in: RoundedRectangle(cornerRadius: 18))
    }
}
/// A bounded image viewport. The bitmap can never widen a scroll view.
struct GameArtwork: View {
    let name: String
    var ratio: CGFloat
    var label: String
    init(_ name: String, ratio: CGFloat = 1.5, label: String = "") {
        self.name = name; self.ratio = ratio; self.label = label
    }
    var body: some View {
        GeometryReader { geometry in
            Image(name).resizable().scaledToFill()
                .frame(width: geometry.size.width, height: geometry.size.height)
                .clipped()
        }
        .aspectRatio(ratio, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .accessibilityLabel(label)
        .accessibilityHidden(label.isEmpty)
    }
}
