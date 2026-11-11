import SwiftUI

enum ActivityShelf {
    case games, stories, create, words
    var title: String {
        switch self {
        case .games: return "Quick games"
        case .stories: return "Stories & kindness"
        case .create: return "Make & move"
        case .words: return "Word adventures"
        }
    }
    var hint: String {
        switch self {
        case .games: return "Pick one game. Look carefully and take your time."
        case .stories: return "Read together and practice being a kind friend."
        case .create: return "Make something, move gently, or simply explore."
        case .words: return "These puzzles have more reading. Invite a grown-up to explore with you."
        }
    }
}
struct ActivityShelfView: View {
    let shelf: ActivityShelf
    var body: some View {
        GameBackground {
            ScrollView {
                VStack(spacing: 16) {
                    StoryHeading(title: shelf.title, subtitle: shelf.hint)
                    switch shelf {
                    case .games:
                        adventureLink("square.grid.2x2.fill", "Puzzle Pals", "Turn two cards over. Find a pair.", to: PuzzleView())
                        adventureLink("leaf.fill", "Find the treasures", "Look for seven hidden pictures.", to: ExploreView())
                        adventureLink("magnifyingglass", "Champ’s Snack Trail", "Find the pretend snack, not the toy.", to: ChampSnackView())
                        adventureLink("puzzlepiece.extension.fill", "Challenge Lab", "Try patterns, trails and calm choices.", to: MammalChallengeLabView())
                    case .stories:
                        adventureLink("book.closed.fill", "Storytime", "Share five little animal stories.", to: MammalStoryMomentsView())
                        adventureLink("heart.fill", "Kind animal choices", "Learn to listen and give animals space.", to: TrustQuizView())
                        adventureLink("person.3.fill", "Meet the family", "Say hello to Stewart, Finn, Champ and Ace.", to: FamilyView())
                    case .create:
                        adventureLink("paintpalette.fill", "My playroom", "Decorate a world of your own.", to: MammalPlayroomView())
                        adventureLink("pawprint.fill", "The Biscuit Factory", "Tap to help Stewie knead.", to: BiscuitView())
                        adventureLink("moon.stars.fill", "Ace’s Freeze Dance", "Follow gentle movement prompts.", to: AceDanceView())
                    case .words:
                        adventureLink("waveform", "Middle C", "Explore sounds, meanings and word clues together.", to: PolarMiddleCView())
                        adventureLink("arrow.left.arrow.right", "Mirror Bridge", "See what changes when a word turns around.", to: PawMirrorBridgeView())
                    }
                    Text("Use the back arrow to choose another activity.")
                        .font(.footnote).foregroundStyle(.secondary)
                }.padding(18)
            }
        }.navigationTitle(shelf.title).navigationBarTitleDisplayMode(.inline)
    }
    private func adventureLink<D: View>(_ icon: String, _ title: String, _ detail: String, to destination: D) -> some View {
        NavigationLink(destination: destination) {
            HStack(alignment: .center, spacing: 12) {
                Image(systemName: icon).font(.title3).foregroundStyle(.teal)
                    .frame(width: 42, height: 46)
                    .background(Color.teal.opacity(0.08), in: RoundedRectangle(cornerRadius: 13))
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(.system(.headline, design: .rounded, weight: .bold))
                    Text(detail).font(.caption).foregroundStyle(.secondary)
                }.fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").font(.caption.bold()).foregroundStyle(.teal)
            }.padding(14).background(.white, in: RoundedRectangle(cornerRadius: 20))
        }.buttonStyle(.plain)
    }
}
