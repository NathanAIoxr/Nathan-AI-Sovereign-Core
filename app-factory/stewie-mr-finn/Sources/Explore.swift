import SwiftUI

struct ExploreView: View {
    @EnvironmentObject private var progress: MammalProgress
    @State private var lastDiscovery: String? = nil

    private let treasures: [(name: String, icon: String, x: CGFloat, y: CGFloat)] = [
        ("The hidden paw", "🐾", 0.21, 0.18),
        ("Stewie's biscuit", "🍪", 0.70, 0.22),
        ("Mr. Finn's feather", "🪶", 0.40, 0.39),
        ("Champ's snack", "🦴", 0.82, 0.53),
        ("Ace's heart", "❤️", 0.15, 0.62),
        ("The friendship star", "⭐", 0.55, 0.72),
        ("The mammal bond", "💛", 0.79, 0.86)
    ]

    var body: some View {
        GameBackground {
            ScrollView {
                VStack(spacing: 18) {
                    StoryHeading(title: "Explore Puzzlewood", subtitle: "Help \(progress.chosenCat) discover seven secret treasures!")
                    HStack { StarCount(); Spacer(); Text("\(progress.findings.count) / 7 found").font(.headline.monospacedDigit()) }
                    GeometryReader { geometry in
                        ZStack {
                            Image("Puzzlewood")
                                .resizable()
                                .scaledToFill()
                                .frame(width: geometry.size.width, height: geometry.size.height)
                                .clipped()
                            ForEach(treasures.indices, id: \.self) { index in
                                if !progress.findings.contains(index) {
                                    Button {
                                        progress.find(index)
                                        lastDiscovery = treasures[index].name
                                    } label: {
                                        Text(treasures[index].icon)
                                            .font(.system(size: 29))
                                            .padding(12)
                                            .background(.white.opacity(0.88), in: Circle())
                                            .shadow(radius: 5)
                                    }
                                    .buttonStyle(.plain)
                                    .position(x: geometry.size.width * treasures[index].x,
                                              y: geometry.size.height * treasures[index].y)
                                    .accessibilityLabel("Find \(treasures[index].name)")
                                }
                            }
                        }
                        .clipShape(RoundedRectangle(cornerRadius: 24))
                    }
                    .aspectRatio(2.0 / 3.0, contentMode: .fit)

                    if let discovery = lastDiscovery { AwardBanner(title: "Found: \(discovery)!") }
                    if progress.findings.count == treasures.count {
                        AwardBanner(title: "Puzzlewood explorer! Every treasure found.")
                    } else {
                        GameCard {
                            Text("🔎 Tap the glowing treasures!")
                                .font(.system(.headline, design: .rounded, weight: .bold))
                            Text("Explore carefully. The best adventurers notice the little things.")
                                .multilineTextAlignment(.center)
                        }
                    }
                }
                .padding(18)
            }
        }
        .navigationTitle("Explore")
        .navigationBarTitleDisplayMode(.inline)
    }
}