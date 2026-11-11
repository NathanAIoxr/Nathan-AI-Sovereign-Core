import SwiftUI

struct PuzzleView: View {
    @EnvironmentObject private var progress: MammalProgress
    @State private var symbols: [String] = []
    @State private var open: Set<Int> = []
    @State private var matches: Set<Int> = []
    @State private var moves = 0
    @State private var locked = false
    @State private var gameId = UUID()
    @State private var hint = "Tap two cards. Matching pictures stay face up."
    private let faces = ["🐈", "🐈‍⬛", "🐾", "🧩", "❤️", "🍪"]

    var body: some View {
        GameBackground {
            ScrollView {
                VStack(spacing: 18) {
                    StoryHeading(title: "Puzzle Pals", subtitle: "Find the matching pairs—just like Stewie and Mr. Finn!")
                    GameArtwork("MirrorArt", ratio: 1.65, label: "Stewart and Mr. Finn solving their coat-pattern puzzle")
                    HStack { StarCount(); Spacer(); Text("\(matches.count / 2) / 6 pairs · \(moves) turns").font(.subheadline.bold()) }
                    GameCard {
                        Text(hint).font(.headline).multilineTextAlignment(.center)
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 9), count: 3), spacing: 9) {
                            ForEach(symbols.indices, id: \.self) { index in
                                Button { flip(index) } label: {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 15)
                                            .fill(open.contains(index) || matches.contains(index) ? Color.white : Color.teal)
                                        Text(open.contains(index) || matches.contains(index) ? symbols[index] : "🐾")
                                            .font(.system(size: 36))
                                    }
                                    .frame(height: 88)
                                    .overlay(RoundedRectangle(cornerRadius: 15).stroke(matches.contains(index) ? Color.orange : Color.teal.opacity(0.2), lineWidth: 2))
                                }
                                .buttonStyle(.plain)
                                .disabled(locked || matches.contains(index))
                                .accessibilityLabel(open.contains(index) || matches.contains(index) ? symbols[index] : "Hidden card \(index + 1)")
                            }
                        }
                    }
                    if matches.count == symbols.count && !symbols.isEmpty {
                        AwardBanner(title: "All the puzzle pieces fit! +25 stars")
                    }
                    PawButton(title: "Shuffle for another round", symbol: "shuffle", action: reset)
                    Text("Cat fact: Stewie's white markings split his black fur. Mr. Finn's markings complement his, almost like puzzle pieces!")
                        .font(.system(.footnote, design: .rounded))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 15)
                }
                .padding(18)
            }
        }
        .navigationTitle("Puzzle Pals")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { if symbols.isEmpty { reset() } }
    }

    private func reset() {
        gameId = UUID()
        symbols = (faces + faces).shuffled()
        open = []
        matches = []
        locked = false
        moves = 0
        hint = "Tap two cards. Matching pictures stay face up."
    }

    private func flip(_ index: Int) {
        guard symbols.indices.contains(index), !locked, !open.contains(index), !matches.contains(index) else { return }
        open.insert(index)
        guard open.count == 2 else { return }
        moves += 1
        let pair = Array(open)
        if symbols[pair[0]] == symbols[pair[1]] {
            hint = "A pair! Both pictures are the same."
            matches.formUnion(pair)
            open = []
            if matches.count == symbols.count { progress.win("puzzle", reward: 25) }
        } else {
            hint = "These pictures are different. Remember where they are and try another pair."
            locked = true
            let roundID = gameId
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.9) {
                guard roundID == gameId else { return }
                open = []
                locked = false
            }
        }
    }
}
