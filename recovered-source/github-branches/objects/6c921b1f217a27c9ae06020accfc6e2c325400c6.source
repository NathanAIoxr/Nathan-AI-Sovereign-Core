import SwiftUI
import UIKit

enum MammalHaptics {
    static func tap() { UIImpactFeedbackGenerator(style: .light).impactOccurred() }
    static func success() { UINotificationFeedbackGenerator().notificationOccurred(.success) }
}

struct ChampSnackView: View {
    @EnvironmentObject private var progress: MammalProgress
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @AppStorage("mammal.pace.v1") private var paceValue = GamePace.steady.rawValue
    @State private var round = 0
    @State private var chosen: Int? = nil
    @State private var hits = 0
    private let foods = ["🥕", "🦴", "🍎", "🫐", "🥣"]
    var body: some View {
        GameBackground {
            ScrollViewReader { proxy in
                ScrollView {
                VStack(spacing: 18) {
                    StoryHeading(title: "Champ's Snack Trail", subtitle: "FATTIE BO DADDY IS ON THE CASE!")
                    GameArtwork("ChampPortrait")
                    GameCard {
                        Text("LONG LEGS • SAUSAGE ROLL • SUPER SNIFFER")
                            .font(.caption.bold()).multilineTextAlignment(.center)
                        ProgressView(value: Double(round), total: 5.0).tint(.orange)
                        if round < 5 {
                            Text("Find Champ's favorite snack!")
                                .font(.system(.title3, design: .rounded, weight: .black))
                            HStack(spacing: 9) {
                                ForEach(0..<3, id: \.self) { i in
                                    let correct = (round + 1) % 3 == i
                                    Button {
                                        guard chosen == nil else { return }
                                        chosen = i
                                        if correct { hits += 1; MammalHaptics.success() }
                                        else { MammalHaptics.tap() }
                                    } label: {
                                        VStack(spacing: 8) {
                                            Text(correct ? foods[round] : (i == 0 ? "🧦" : "🧸"))
                                                .font(.system(size: 43))
                                            Text("Sniff here").font(.caption.bold())
                                        }.frame(maxWidth: .infinity, minHeight: 113)
                                            .background(chosen == i ? Color.yellow.opacity(0.5) : Color.teal.opacity(0.13),
                                                        in: RoundedRectangle(cornerRadius: 17))
                                    }.buttonStyle(.plain).disabled(chosen != nil)
                                }
                            }
                            if chosen != nil {
                                Text(chosen == (round + 1) % 3 ? "You found the pretend snack! 🐾" : "That is a sock or toy. Look for the food picture. Ask a grown-up about real dog treats.")
                                    .font(.headline).multilineTextAlignment(.center).id("answer-feedback")
                                PawButton(title: chosen == (round + 1) % 3 ? "Next sniff!" : "Try again", symbol: "arrow.right") {
                                    guard chosen == (round + 1) % 3 else { chosen = nil; return }
                                    chosen = nil; round += 1
                                    if round == 5 { progress.win("champ-sniff", reward: 35) }
                                }
                            }
                        } else {
                            AwardBanner(title: "FOOD DETECTIVE! +35 stars")
                            Text("You found \(hits) of 5 snacks!")
                            PawButton(title: "Sniff again", symbol: "arrow.clockwise") { round = 0; chosen = nil; hits = 0 }
                        }
                    }
                    GameCard {
                        Text("WHO IS CHAMP? 🐕").font(.headline)
                        Text("Champ, also called Fattie Bo Daddy, is Nathan and Collyn's beautiful tan hound dog mammal cousin. He weighs about 40–50 pounds, has LONG LEGS and a round body like a sausage roll—with a head, legs and a tail! He's not food aggressive. He just loves FOOD. If he thinks you're hiding a snack, he'll even inspect your sleeves!")
                            .multilineTextAlignment(.center)
                        Text("A trusted adult should choose dog-safe snacks; never tease animals with food.")
                            .font(.footnote).foregroundStyle(.secondary).multilineTextAlignment(.center)
                    }
                }.padding(18)
            }
                .onChange(of: chosen) { _, _ in
                    guard chosen != nil else { return }
                    if reduceMotion { proxy.scrollTo("answer-feedback", anchor: .center) }
                    else {
                        withAnimation(.easeInOut(duration: GamePace.restored(paceValue).animationSeconds)) {
                            proxy.scrollTo("answer-feedback", anchor: .center)
                        }
                    }
                }
                }
        }.navigationTitle("Champ's Snack Trail").navigationBarTitleDisplayMode(.inline)
    }
}

struct AceDanceView: View {
    @EnvironmentObject private var progress: MammalProgress
    @State private var step = 0
    @State private var wiggle = false
    @AppStorage("mammal.motion.v4") private var motionEnabled = true
    @AppStorage("mammal.pace.v1") private var paceValue = GamePace.steady.rawValue
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    private let cues = [
        "CALL ACE!", "HEAD TILT", "RIGHT SHOULDER", "RIGHT FOOT",
        "LISTEN TO ACE", "GOOD NIGHT, ACE!"
    ]
    private let lessons = [
        "Ace hears his name. What will he do?",
        "He FREEZES and cocks his head! Can you tilt yours gently?",
        "His right shoulder drops. That's his memorable pose!",
        "His right foot turns outward. Fancy chicken feet!",
        "When a dog freezes or shakes, watch for stress and give him room.",
        "This loyal boy sleeps in Nathan's room every night!"
    ]
    var body: some View {
        GameBackground {
            ScrollView {
                VStack(spacing: 18) {
                    StoryHeading(title: "Ace's Freeze Dance", subtitle: "The sweetest little wildebeest!")
                    GameArtwork("AcePortrait")
                    GameCard {
                        Text("MOVE • FREEZE • LISTEN").font(.caption.bold()).tracking(2)
                        ProgressView(value: Double(step), total: 6.0).tint(.teal)
                        Text(cues[min(step, 5)]).font(.system(size: 27, weight: .black, design: .rounded))
                            .multilineTextAlignment(.center)
                        Image(systemName: step == 4 ? "heart.fill" : "pawprint.fill")
                            .font(.system(size: 86)).foregroundStyle(step == 4 ? Color.pink : Color.orange)
                            .rotationEffect(.degrees(motionEnabled && !reduceMotion ? (wiggle ? 8 : -8) : 0))
                            .scaleEffect(motionEnabled && !reduceMotion && wiggle ? 1.13 : 1.0)
                            .animation(motionEnabled && !reduceMotion ? .spring(response: GamePace.restored(paceValue).animationSeconds, dampingFraction: 0.55) : nil, value: wiggle)
                            .padding(10)
                        Text(lessons[min(step, 5)]).multilineTextAlignment(.center)
                        if step < 6 {
                            PawButton(title: "Ready! Next move", symbol: "arrow.right") {
                                wiggle.toggle(); step += 1; MammalHaptics.tap()
                                if step == 6 { progress.win("ace-dance", reward: 35); MammalHaptics.success() }
                            }
                        } else {
                            AwardBanner(title: "LOYAL MAMMAL! +35 stars")
                            PawButton(title: "Dance again", symbol: "arrow.clockwise") { step = 0 }
                        }
                    }
                    GameCard {
                        Text("WHO IS ACE? 🐶").font(.headline)
                        Text("Ace is Nathan and Collyn's dog mammal cousin: a sweet, energetic, super-loyal Australian Shepherd, about 30 pounds, with LONG reddish-brown hair, a white chest and white feet. From behind, he looks like a WILDEBEEST! His feathery paws look like fancy chicken feet. He loves Nathan so much he sleeps in his room every night.")
                            .multilineTextAlignment(.center)
                        Text("Important: a dog's freeze or shake doesn't always mean excitement. Respect his boundaries and look at his whole body.")
                            .font(.footnote).foregroundStyle(.secondary).multilineTextAlignment(.center)
                    }
                }.padding(18)
            }
        }.navigationTitle("Ace's Freeze Dance").navigationBarTitleDisplayMode(.inline)
    }
}
