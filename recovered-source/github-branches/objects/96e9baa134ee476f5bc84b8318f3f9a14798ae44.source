import SwiftUI

struct GameHomeView: View {
    @EnvironmentObject private var progress: MammalProgress

    var body: some View {
        NavigationStack {
            GameBackground {
                ScrollView {
                    VStack(spacing: 16) {
                        HStack {
                            Text("🐾  MAMMAL ADVENTURES")
                                .font(.system(.caption, design: .rounded, weight: .black))
                            Spacer()
                            StarCount()
                        }
                        .padding(.top, 8)

                        StoryHeading(title: "Stewart & Mr. Finn", subtitle: "TWO CATS. ONE PUZZLE. ENDLESS ADVENTURES!")
                        Image("CatHeroes")
                            .resizable()
                            .scaledToFill()
                            .frame(height: 235)
                            .clipped()
                            .clipShape(RoundedRectangle(cornerRadius: 25))
                            .accessibilityLabel("Two black and white patchwork cats, Stewart and Mr. Finn")

                        GameCard {
                            Text("Meet your adventure partner")
                                .font(.system(.headline, design: .rounded, weight: .bold))
                            HStack(spacing: 10) {
                                catChoice("Stewart", label: "Stewart (Stewie)", detail: "White splits his black coat", icon: "🐈")
                                catChoice("Mr. Finn", label: "Mr. Finn", detail: "His puzzle-piece pal", icon: "🐈‍⬛")
                            }
                        }

                        Text("CHOOSE AN ADVENTURE")
                            .font(.system(.caption, design: .rounded, weight: .black))
                            .tracking(2)
                            .padding(.top, 4)

                        adventureLink("🌲", "Explore Puzzlewood", "Find seven hidden treasures", to: ExploreView())
                        adventureLink("🧩", "Puzzle Pals", "Match the mammal pairs", to: PuzzleView())
                        adventureLink("🐾", "The Biscuit Factory", "Tap out twelve happy biscuits", to: BiscuitView())
                        adventureLink("❤️", "Speak Their Language", "Learn kindness and trust", to: TrustQuizView())
                        adventureLink("📖", "The Mammal Family", "Meet the seven real-life mammals", to: FamilyView())
                        Text("By Nathan Tabor, a Human Mammal")
                            .font(.system(.footnote, design: .rounded))
                            .foregroundStyle(.secondary)
                            .padding(.vertical, 16)
                    }
                    .padding(.horizontal, 18)
                }
            }
            .toolbar(.hidden, for: .navigationBar)
        }
        .tint(.teal)
    }

    private func catChoice(_ name: String, label: String, detail: String, icon: String) -> some View {
        let selected = progress.chosenCat == name
        return Button { progress.choose(name) } label: {
            VStack(spacing: 4) {
                Text(icon).font(.largeTitle)
                Text(label).font(.system(.caption, design: .rounded, weight: .heavy))
                Text(detail).font(.system(size: 10, weight: .medium, design: .rounded)).multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity, minHeight: 107)
            .padding(8)
            .background(selected ? Color.mint.opacity(0.24) : Color.gray.opacity(0.08), in: RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(selected ? .teal : .clear, lineWidth: 2.5))
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    private func adventureLink<Destination: View>(_ icon: String, _ title: String, _ detail: String, to destination: Destination) -> some View {
        NavigationLink(destination: destination) {
            HStack(spacing: 14) {
                Text(icon).font(.system(size: 32)).frame(width: 47)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(.system(.headline, design: .rounded, weight: .bold))
                    Text(detail).font(.system(.caption, design: .rounded)).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(.teal)
            }
            .padding(15)
            .background(.white, in: RoundedRectangle(cornerRadius: 20))
        }
        .buttonStyle(.plain)
    }
}