import SwiftUI

/// Three distinct, repeatable activities, with all content and progress stored on device.
struct MammalChallengeLabView: View {
    @EnvironmentObject private var progress: MammalProgress
    @State private var challenge = 0
    @State private var round = 0
    @State private var successes = 0
    @State private var message = "Choose a challenge!"
    @State private var boardSeed = 0
    @State private var solved = false

    private let modes = ["Paint-Pony Puzzle", "Champ's Nose Knows", "Ace's Calm Choices"]
    private let icons = ["square.grid.3x3", "pawprint", "heart.text.square"]
    private var finished: Bool { round >= 5 }
    private var target: Int { (round * 7 + boardSeed * 3 + 1) % 9 }
    private let responses = ["Give space and watch", "Offer a calm invitation", "Ask a trusted grown-up"]
    private let safeAnswers = [0, 1, 2, 0, 1]

    var body: some View {
        GameBackground {
            ScrollViewReader { proxy in
                ScrollView {
                VStack(spacing: 16) {
                    StoryHeading(title: "THE MAMMAL CHALLENGE LAB", subtitle: "Three brand-new ways to play, learn, and discover.")
                    GameArtwork("MirrorArt", ratio: 1.65)
                    GameCard {
                        Text("Choose a mini-adventure").font(.headline)
                        ForEach(0..<modes.count, id: \.self) { i in
                            Button { select(i) } label: {
                                HStack(spacing: 12) {
                                    Image(systemName: icons[i]).frame(width: 25)
                                    Text(modes[i]).font(.headline)
                                    Spacer()
                                    if challenge == i { Image(systemName: "checkmark.circle.fill") }
                                }
                                .padding(13)
                                .foregroundStyle(challenge == i ? Color.white : Color.primary)
                                .background(challenge == i ? Color.teal : Color.gray.opacity(0.1), in: RoundedRectangle(cornerRadius: 13))
                            }
                            .accessibilityAddTraits(challenge == i ? .isSelected : [])
                        }
                    }
                    GameCard {
                        Text(modes[challenge]).font(.title2.bold()).multilineTextAlignment(.center)
                        Text(finished ? "ALL FIVE ROUNDS COMPLETE!" : "ROUND \(round + 1) OF 5")
                            .font(.caption.bold())
                        ProgressView(value: Double(min(round, 5)), total: 5)
                            .tint(.teal)
                        if finished {
                            Text("🌟").font(.system(size: 68))
                            Text("You earned \(successes) happy paws!")
                                .font(.headline)
                            Text("Try again for a new pattern, or choose another game.")
                                .font(.footnote).multilineTextAlignment(.center)
                            PawButton(title: "Play again", symbol: "arrow.clockwise") {
                                boardSeed += 1
                                reset()
                            }
                        } else {
                            Group {
                            switch challenge {
                            case 0: paintPuzzle
                            case 1: champTrail
                            default: aceChoices
                            }
                            }.disabled(solved)
                            if solved {
                                PawButton(title: round == 4 ? "Finish game" : "Next round", symbol: "arrow.right") {
                                    round += 1; solved = false
                                    message = "Take your time. Look for the clue."
                                    if finished { progress.win("challenge.lab.\(challenge)", reward: 30) }
                                }
                            }
                        }
                        Text(message).font(.subheadline).multilineTextAlignment(.center).id("answer-feedback")
                            .accessibilityAddTraits(.updatesFrequently)
                    }
                    GameCard {
                        Text("YOUR WORD IS YOUR BOND").font(.headline)
                        Text("Cats and dogs tell us things through their bodies and choices. We listen, act kindly, and never force them to play.")
                            .font(.footnote).multilineTextAlignment(.center)
                    }
                }.padding(18)
            }
                .onChange(of: message) { _, _ in
                    withAnimation { proxy.scrollTo("answer-feedback", anchor: .center) }
                }
                }
        }
        .onAppear {
            #if DEBUG
            if ProcessInfo.processInfo.arguments.contains("--qa-wrong") { answer(false) }
            #endif
        }
        .navigationTitle("Challenge Lab")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var paintPuzzle: some View {
        VStack(spacing: 12) {
            Text("Find the WHITE patch that splits the BLACK coat, just like Stewie!")
                .multilineTextAlignment(.center)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: 3), spacing: 6) {
                ForEach(0..<9, id: \.self) { i in
                    Button {
                        answer(i == target)
                    } label: {
                        ZStack {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(i == target ? Color.white : Color.black)
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(.gray.opacity(0.65), lineWidth: 2))
                            if i == target { Image(systemName: "pawprint.fill").foregroundStyle(.black) }
                            else { Image(systemName: "moon.stars.fill").foregroundStyle(.white.opacity(0.55)) }
                        }.frame(height: 72)
                    }
                    .accessibilityLabel(i == target ? "White patch" : "Black patch")
                }
            }
            Text("Mr. Finn has nearly opposite markings. Two cats, one living puzzle!")
                .font(.caption).multilineTextAlignment(.center)
        }
    }

    private var champTrail: some View {
        VStack(spacing: 12) {
            Text("Champ is a long-legged tan hound who loves snacks. Which trail holds his DOG-SAFE pretend biscuit?")
                .multilineTextAlignment(.center)
            GameArtwork("ChampPortrait", ratio: 1.65)
                .accessibilityHidden(true)
            HStack(spacing: 8) {
                ForEach(0..<3, id: \.self) { i in
                    let correct = (round + boardSeed) % 3 == i
                    Button { answer(correct) } label: {
                        VStack {
                            Text(correct ? "🦴" : (i == 0 ? "🧸" : "🧦")).font(.system(size: 37))
                            Text("Trail \(i+1)").font(.caption.bold())
                        }.frame(maxWidth: .infinity).padding(.vertical, 17)
                            .background(.orange.opacity(0.18), in: RoundedRectangle(cornerRadius: 14))
                    }
                }
            }
            Text("It's a pretend game. Ask an adult before sharing any real food with a dog.")
                .font(.caption).multilineTextAlignment(.center)
        }
    }

    private var aceChoices: some View {
        VStack(spacing: 12) {
            GameArtwork("AcePortrait", ratio: 1.65)
                .accessibilityHidden(true)
            Text([
                "Ace freezes and tilts his head. What's a good first response?",
                "Ace approaches with a loose, relaxed body. What can you do?",
                "You meet an unfamiliar dog in the park. Who should help?",
                "Ace turns away from petting. What is kind?",
                "Ace seems interested in play. How should you invite him?"
            ][round]).font(.headline).multilineTextAlignment(.center)
            ForEach(0..<3, id: \.self) { i in
                Button { answer(i == safeAnswers[round]) } label: {
                    Text(responses[i]).frame(maxWidth: .infinity).padding(13)
                        .background(.mint.opacity(0.23), in: RoundedRectangle(cornerRadius: 13))
                }
            }
        }
    }

    private func select(_ index: Int) {
        challenge = index
        boardSeed += 1
        reset()
    }
    private func reset() {
        round = 0; successes = 0; solved = false
        message = "Take your time. Every try is welcome."
    }
    private func answer(_ correct: Bool) {
        guard !solved else { return }
        let clue: String
        switch challenge {
        case 0: clue = "Look for the white square with a dark paw. The other squares are black."
        case 1: clue = "The bone-shaped biscuit is pretend dog food. A sock or teddy is not a snack."
        default:
            clue = [
                "When Ace freezes, pause and give him room. Watch his whole body to see how he feels.",
                "A relaxed dog may want to play. Invite him gently and let him choose.",
                "Ask a trusted grown-up before going near a dog you do not know.",
                "Turning away can mean 'I need a break.' Stop petting and give Ace space.",
                "Invite Ace calmly. He can choose to join in or rest."
            ][round]
        }
        message = (correct ? "You found it! " : "Here’s a clue. ") + clue
        if correct { successes += 1; solved = true; MammalHaptics.success() }
        else { MammalHaptics.tap() }
    }
}
