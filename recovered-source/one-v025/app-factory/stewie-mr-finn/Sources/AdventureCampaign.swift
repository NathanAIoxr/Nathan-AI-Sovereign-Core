import SwiftUI

private enum QuestType: Int, CaseIterable {
    case memory, pawPath, treasure, kindness
    var label: String {
        switch self {
        case .memory: return "Memory Pairs"
        case .pawPath: return "Paw Path"
        case .treasure: return "Treasure Hunt"
        case .kindness: return "Mammal Language"
        }
    }
    var icon: String {
        switch self {
        case .memory: return "square.grid.3x3.fill"
        case .pawPath: return "pawprint.fill"
        case .treasure: return "sparkles"
        case .kindness: return "heart.fill"
        }
    }
}
private struct QuestWorld: Identifiable {
    var id: Int
    var name: String
    var blurb: String
    var emoji: String
    var tint: Color
}
private let questWorlds: [QuestWorld] = [
    .init(id: 0, name: "Puzzlewood", blurb: "A world of hidden pathways and puzzle cats", emoji: "🌳", tint: .teal),
    .init(id: 1, name: "Biscuit Hollow", blurb: "Stewie's soft paws and patient friendships", emoji: "🍪", tint: .orange),
    .init(id: 2, name: "Finn's Mirror Maze", blurb: "Two cats, complementary puzzle-piece coats", emoji: "🧩", tint: .indigo),
    .init(id: 3, name: "Champ's Snack Trail", blurb: "Find clues with our long-legged food detective", emoji: "🐕", tint: .brown),
    .init(id: 4, name: "Ace's Moonlit Meadow", blurb: "The little wildebeest listens and learns", emoji: "🌙", tint: .purple),
    .init(id: 5, name: "The Mammal Bond", blurb: "Keep your word, respect boundaries, grow together", emoji: "💞", tint: .pink)
]
private struct QuestLevel: Identifiable {
    var id: Int
    var world: QuestWorld { questWorlds[(id - 1) / 8] }
    var board: Int { (id - 1) % 8 + 1 }
    var type: QuestType { QuestType(rawValue: (id + (id - 1) / 8 - 1) % 4)! }
    var difficulty: Int { min(7, 3 + board / 2 + world.id / 2) }
}

private final class QuestProgress: ObservableObject {
    static let shared = QuestProgress()
    @Published private(set) var ratings: [Int:Int]
    init() {
        let source = UserDefaults.standard.dictionary(forKey: "mammal.campaign.v3") as? [String:Int] ?? [:]
        ratings = Dictionary(uniqueKeysWithValues: source.compactMap { key, value in Int(key).map { ($0, value) } })
    }
    func unlocked(_ id: Int) -> Bool { id == 1 || ratings[id - 1] != nil }
    func finish(_ id: Int, stars: Int) {
        guard unlocked(id), id >= 1, id <= 48 else { return }
        ratings[id] = max(stars, ratings[id] ?? 0)
        UserDefaults.standard.set(Dictionary(uniqueKeysWithValues: ratings.map { (String($0.key), $0.value) }), forKey: "mammal.campaign.v3")
    }
}
struct CampaignMapView: View {
    @StateObject private var campaign = QuestProgress.shared
    var body: some View {
        GameBackground {
            ScrollView {
                VStack(spacing: 17) {
                    StoryHeading(title: "THE GRAND ADVENTURE", subtitle: "Six magical worlds · 48 playable boards · a lifetime of mammal lessons")
                    GameCard {
                        HStack { Text("Campaign completed").font(.headline); Spacer(); Text("\(campaign.ratings.count) / 48").bold().monospacedDigit() }
                        ProgressView(value: Double(campaign.ratings.count), total: 48).tint(.teal)
                        Text("Clear a board to unlock the next. Earn one, two, or three stars!").font(.footnote)
                    }
                    ForEach(questWorlds) { world in
                        GameCard {
                            Image("World\(world.id)")
                                .resizable().scaledToFill().frame(height: 116).clipped()
                                .clipShape(RoundedRectangle(cornerRadius: 17))
                            HStack(spacing: 12) {
                                Text(world.emoji).font(.system(size: 39))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(world.name).font(.system(.title3, design: .rounded, weight: .heavy))
                                    Text(world.blurb).font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer(minLength: 0)
                            }
                            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 4), spacing: 8) {
                                ForEach(1...8, id: \.self) { number in
                                    let level = QuestLevel(id: world.id * 8 + number)
                                    NavigationLink(destination: QuestBoardView(levelID: level.id)) {
                                        VStack(spacing: 5) {
                                            Image(systemName: campaign.unlocked(level.id) ? level.type.icon : "lock.fill")
                                            Text("\(number)").font(.headline.monospacedDigit())
                                            Text(String(repeating: "★", count: campaign.ratings[level.id] ?? 0))
                                                .font(.caption2).frame(height: 10)
                                        }
                                        .foregroundStyle(campaign.unlocked(level.id) ? world.tint : .gray)
                                        .frame(maxWidth: .infinity).frame(height: 72)
                                        .background(world.tint.opacity(campaign.unlocked(level.id) ? 0.14 : 0.04), in: RoundedRectangle(cornerRadius: 13))
                                    }
                                    .disabled(!campaign.unlocked(level.id))
                                    .accessibilityLabel("Board \(level.id), \(campaign.unlocked(level.id) ? "unlocked" : "locked")")
                                }
                            }
                        }
                    }
                    Text("Safe for kids: no ads, no in-app purchases, no accounts, and no animal teasing.")
                        .font(.footnote).multilineTextAlignment(.center)
                }.padding(18)
            }
        }
        .navigationTitle("Adventure Map").navigationBarTitleDisplayMode(.inline)
    }
}

private struct MammalQuestion {
    let question: String
    let choices: [String]
    let answer: Int
    let explanation: String
}
private let kindQuestions: [MammalQuestion] = [
    .init(question: "Stewie walks away when you touch his ear. What do you do?", choices: ["Let him have space", "Chase him", "Pull his tail"], answer: 0, explanation: "Let cats choose when to cuddle."),
    .init(question: "Ace freezes and shakes. What's a kind response?", choices: ["Shout loudly", "Observe and give space", "Grab his paws"], answer: 1, explanation: "A dog's freeze can have different meanings. Watch the whole body."),
    .init(question: "Champ thinks you have a snack. What is safest?", choices: ["Give chocolate", "Tease him", "Ask an adult about dog-safe food"], answer: 2, explanation: "Adults can help choose safe treats."),
    .init(question: "Your dog is learning a new cue. What works best?", choices: ["Be patient and reward gently", "Get angry", "Scare them"], answer: 0, explanation: "Trust grows through kindness and consistent practice."),
    .init(question: "A cat slow-blinks at you. What might that mean?", choices: ["It wants a bath", "It feels relaxed", "It wants you to shout"], answer: 1, explanation: "Slow-blinking can be a friendly signal."),
    .init(question: "How do you grow a mammal bond?", choices: ["Demand obedience", "Never listen", "Keep your promises"], answer: 2, explanation: "Your word is your bond. Be someone animals can trust."),
    .init(question: "A dog wags but looks stiff. What do you do?", choices: ["Observe the whole body and give room", "Grab its face", "Assume it wants hugging"], answer: 0, explanation: "A wag alone doesn't tell the whole story."),
    .init(question: "How do mammals speak to us?", choices: ["Only with human words", "With bodies, sounds and choices", "By reading minds"], answer: 1, explanation: "Listen, watch and respect boundaries.")
]
struct QuestBoardView: View {
    let levelID: Int
    @StateObject private var campaign = QuestProgress.shared
    @EnvironmentObject private var overallProgress: MammalProgress
    @State private var round = UUID()
    @State private var mistakes = 0
    @State private var cards: [Int] = []
    @State private var shown: Set<Int> = []
    @State private var matched: Set<Int> = []
    @State private var busy = false
    @State private var step = 0
    @State private var completed = false
    @State private var feedback: String? = nil
    private let icons = ["🐾","🍪","🧩","🐈","🐕","⭐","❤️","🪶"]
    private var level: QuestLevel { QuestLevel(id: levelID) }
    private var count: Int { level.difficulty }
    private var rating: Int { mistakes == 0 ? 3 : mistakes < 3 ? 2 : 1 }

    var body: some View {
        GameBackground {
            ScrollView {
                VStack(spacing: 17) {
                    HStack { StarCount(); Spacer(); Text("WORLD \(level.world.id+1) · BOARD \(level.board)").font(.caption.bold()) }
                    StoryHeading(title: level.type.label, subtitle: level.world.name)
                    GameCard {
                        Text(level.world.emoji).font(.system(size: 54))
                        HStack {
                            Text("Challenge \(step + 1) of \(count)").font(.headline)
                            Spacer()
                            Text("Misses \(mistakes)").font(.caption.bold())
                        }
                        ProgressView(value: Double(completed ? count : step), total: Double(count)).tint(level.world.tint)
                        if completed {
                            Image(systemName: "trophy.fill").font(.system(size: 64)).foregroundStyle(.orange)
                            Text("BOARD COMPLETE!").font(.title2.bold())
                            Text(String(repeating: "★", count: rating)).font(.largeTitle).foregroundStyle(.orange)
                            Text("Patience, kindness and curiosity are your superpowers.")
                                .multilineTextAlignment(.center)
                            if levelID < 48 {
                                NavigationLink(destination: QuestBoardView(levelID: levelID+1)) {
                                    Label("NEXT BOARD", systemImage: "arrow.right.circle.fill")
                                        .font(.headline).foregroundStyle(.white).frame(maxWidth: .infinity).padding(15)
                                        .background(.teal, in: RoundedRectangle(cornerRadius: 16))
                                }
                            }
                            PawButton(title: "Play again", symbol: "arrow.clockwise", action: reset)
                        } else {
                            challenge
                        }
                    }
                    GameCard {
                        Text("YOUR WORD IS YOUR BOND").font(.headline)
                        Text("Never scare, force, or tease another mammal. Real animals tell us how they feel with their body language.")
                            .font(.footnote).multilineTextAlignment(.center)
                    }
                }.padding(18)
            }
        }
        .navigationTitle("Board \(levelID)").navigationBarTitleDisplayMode(.inline)
        .onAppear { if cards.isEmpty { reset() } }
    }
    @ViewBuilder private var challenge: some View {
        switch level.type {
        case .memory:
            Text("Match the \(count) animal-picture pairs.").font(.subheadline)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 4), spacing: 8) {
                ForEach(cards.indices, id: \.self) { index in
                    Button { flip(index) } label: {
                        Text(shown.contains(index) || matched.contains(index) ? icons[cards[index]] : "❔")
                            .font(.system(size: 31)).frame(maxWidth: .infinity).frame(height: 68)
                            .background(matched.contains(index) ? Color.mint.opacity(0.5) : Color.teal.opacity(0.17), in: RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(busy || matched.contains(index) || shown.contains(index))
                }
            }
            Text("\(matched.count / 2) pairs found").font(.caption.bold())
        case .pawPath:
            Text("Tap the numbered pawprints in order, from 1 to \(count).").multilineTextAlignment(.center)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3), spacing: 10) {
                ForEach(cards, id: \.self) { number in
                    Button { tapPaw(number) } label: {
                        VStack { Text("🐾").font(.title); Text("\(number)").font(.headline.monospacedDigit()) }
                            .frame(maxWidth: .infinity).frame(height: 75)
                            .background(number <= step ? Color.mint.opacity(0.4) : Color.orange.opacity(0.20), in: RoundedRectangle(cornerRadius: 13))
                    }.disabled(number <= step)
                }
            }
        case .treasure:
            Text("Find the matching treasure!").font(.headline)
            Text(icons[step % icons.count]).font(.system(size: 63))
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 10) {
                ForEach(0..<6, id: \.self) { slot in
                    let answerSlot = (step * 3 + levelID) % 6
                    let target = step % icons.count
                    let other = (target + slot + 1) % icons.count
                    Button { choose(slot == answerSlot) } label: {
                        Text(icons[slot == answerSlot ? target : other]).font(.system(size: 36))
                            .frame(maxWidth: .infinity).frame(height: 77)
                            .background(Color.orange.opacity(0.17), in: RoundedRectangle(cornerRadius: 13))
                    }
                }
            }
        case .kindness:
            let q = kindQuestions[(step + level.world.id) % kindQuestions.count]
            Text(q.question).font(.title3.bold()).multilineTextAlignment(.center)
            ForEach(q.choices.indices, id: \.self) { index in
                Button {
                    guard feedback == nil else { return }
                    if index != q.answer {
                        mistakes += 1
                        feedback = "Try again with kindness. " + q.explanation
                    } else {
                        feedback = q.explanation
                    }
                } label: {
                    Text(q.choices[index]).frame(maxWidth: .infinity).padding(14)
                        .background(Color.teal.opacity(0.14), in: RoundedRectangle(cornerRadius: 13))
                }.disabled(feedback != nil)
            }
            if let feedback {
                Text(feedback).font(.footnote).multilineTextAlignment(.center)
                PawButton(title: "Next", symbol: "arrow.right") {
                    self.feedback = nil
                    advance()
                }
            }
        }
    }
    private func reset() {
        round = UUID(); mistakes = 0; shown = []; matched = []; busy = false
        step = 0; completed = false; feedback = nil
        if level.type == .memory {
            cards = (Array(0..<count) + Array(0..<count)).shuffled()
        } else { cards = Array(1...count).shuffled() }
    }
    private func advance() {
        step += 1; MammalHaptics.tap()
        if step >= count { finish() }
    }
    private func finish() {
        completed = true
        campaign.finish(levelID, stars: rating)
        overallProgress.win("campaign.\(levelID)", reward: rating * 10)
        MammalHaptics.success()
    }
    private func flip(_ index: Int) {
        guard !busy, !shown.contains(index), !matched.contains(index) else { return }
        shown.insert(index)
        if shown.count == 2 {
            let pair = Array(shown)
            if cards[pair[0]] == cards[pair[1]] {
                matched.formUnion(pair); shown = []
                step = matched.count / 2
                if matched.count == cards.count { finish() }
            } else {
                mistakes += 1; busy = true
                let token = round
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.85) {
                    guard token == round else { return }
                    shown = []; busy = false
                }
            }
        }
    }
    private func tapPaw(_ number: Int) {
        if number == step+1 { advance() }
        else { mistakes += 1; MammalHaptics.tap() }
    }
    private func choose(_ correct: Bool) {
        if correct { advance() } else { mistakes += 1; MammalHaptics.tap() }
    }
}
