import SwiftUI

struct BiscuitView: View {
    @EnvironmentObject private var progress: MammalProgress
    @State private var biscuits = 0
    @State private var pulse = false
    private let goal = 12
    @AppStorage("mammal.motion.v4") private var motionEnabled = true
    @AppStorage("mammal.pace.v1") private var paceValue = GamePace.steady.rawValue
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        GameBackground {
            ScrollView {
                VStack(spacing: 20) {
                    StoryHeading(title: "The Biscuit Factory", subtitle: "Stewie's little motor goes PURRRRRR!")
                    GameArtwork("BiscuitArt", label: "Stewart and Mr. Finn making biscuits")
                    GameCard {
                        Text("PURRRRRR...")
                            .font(.system(size: 23, weight: .black, design: .rounded))
                            .foregroundStyle(.teal)
                        Text("\(biscuits) / \(goal) biscuits")
                            .font(.system(.title2, design: .rounded, weight: .bold))
                            .monospacedDigit()
                        ProgressView(value: Double(biscuits), total: Double(goal))
                            .tint(.orange)
                        Button {
                            guard biscuits < goal else { return }
                            biscuits += 1
                            pulse.toggle()
                            if biscuits == goal { progress.win("biscuits", reward: 25) }
                        } label: {
                            ZStack {
                                Circle().fill(.orange.opacity(0.16)).frame(width: 185, height: 185)
                                Image(systemName: "pawprint.fill")
                                    .font(.system(size: 96))
                                    .foregroundStyle(.brown)
                                    .scaleEffect(motionEnabled && !reduceMotion && pulse ? 1.04 : 1.0)
                                    .animation(motionEnabled && !reduceMotion ? .spring(response: GamePace.restored(paceValue).animationSeconds) : nil, value: pulse)
                            }
                        }
                        .buttonStyle(.plain)
                        .disabled(biscuits == goal)
                        .accessibilityLabel("Make a biscuit")
                        Text("Tap the paw to knead a biscuit!")
                            .font(.system(.headline, design: .rounded))
                        if biscuits == goal { AwardBanner(title: "BISCUIT FACTORY OPEN! +25 stars") }
                    }
                    PawButton(title: "Make another batch", symbol: "arrow.clockwise") { biscuits = 0 }
                    GameCard {
                        Text("THE STEWIE STORY 🐈")
                            .font(.headline)
                        Text("After a long time getting comfortable, Stewie climbed onto Nathan's chest, purred, and started making biscuits. But an accidental ear touch? ZOOM! Stewie left. Love means respecting a cat's choice.")
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(18)
            }
        }
        .navigationTitle("Biscuit Factory")
        .navigationBarTitleDisplayMode(.inline)
    }
}