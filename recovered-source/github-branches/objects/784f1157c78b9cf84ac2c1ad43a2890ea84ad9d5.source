import SwiftUI

/// The shared entrance to every existing offline chapter and activity.
/// Existing campaign, Polar Family, and sticker save formats remain untouched.
struct UnifiedAdventureView: View {
    @EnvironmentObject private var progress: MammalProgress
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @AppStorage("mammal.pace.v1") private var paceValue = GamePace.steady.rawValue
    @AppStorage("mammal.motion.v4") private var motionEnabled = true
    @AppStorage("mammal.polar.quest.v1") private var polarSave = ""
    @State private var campaignCount = 0
    @State private var expandedZone = -1

    private let names = [
        "Puzzlewood", "Biscuit Hollow", "Finn's Mirror Maze",
        "Champ's Snack Trail", "Ace's Moonlit Meadow", "The Mammal Bond"
    ]
    private let summaries = [
        "Explore, discover and find matching pairs",
        "Bake, decorate and make your own world",
        "Word mirrors, sounds, patterns and numbers",
        "Treasure trails and the animals we love",
        "Gentle movement, listening and calm choices",
        "Stories, kindness, and the Polar Family reunion"
    ]
    private let symbols = [
        "leaf.fill", "pawprint.fill", "square.on.square", "magnifyingglass",
        "moon.stars.fill", "heart.fill"
    ]
    private var pace: GamePace { GamePace.restored(paceValue) }
    private var polarCount: Int { PolarFamilySave.restored(polarSave).completed }

    var body: some View {
        GameBackground {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 17) {
                    HStack(spacing: 10) {
                        Text("With \(progress.chosenCat)").font(.headline)
                        Spacer(minLength: 8)
                        StarCount()
                    }

                    GameCard {
                        Text("Continue").font(.title3.bold())
                        link("map.fill", "Six Worlds · \(campaignCount)/48 boards", CampaignMapView())
                        link("snowflake", "Polar Family · \(polarCount)/16 chapters", PolarFamilyQuestView())
                    }

                    GameCard {
                        HStack {
                            Image(systemName: "speedometer").foregroundStyle(.teal)
                            Text("Your play pace").font(.headline)
                            Spacer(minLength: 8)
                            Picker("Play pace", selection: $paceValue) {
                                ForEach(GamePace.allCases) { option in
                                    Text(option.title).tag(option.rawValue)
                                }
                            }
                            .pickerStyle(.menu)
                        }
                        Text("No timers. Every answer waits for you.")
                            .font(.footnote).foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Text("Explore")
                        .font(.title2.bold()).padding(.horizontal, 5)
                    ForEach(0..<names.count, id: \.self) { zone in
                        GameCard {
                            Button {
                                withAnimation((reduceMotion || !motionEnabled) ? nil : .easeInOut(duration: pace.animationSeconds)) {
                                    expandedZone = expandedZone == zone ? -1 : zone
                                }
                            } label: {
                                HStack(alignment: .center, spacing: 12) {
                                    Image(systemName: symbols[zone])
                                        .foregroundStyle(.teal).frame(width: 30)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("WORLD \(zone + 1) — " + names[zone])
                                            .font(.headline).foregroundStyle(.primary)
                                    }
                                    Spacer(minLength: 0)
                                    Image(systemName: expandedZone == zone ? "chevron.up" : "chevron.down")
                                        .foregroundStyle(.teal)
                                }
                                .frame(maxWidth: .infinity, minHeight: 48)
                                .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel(names[zone] + (expandedZone == zone ? ", collapse" : ", expand"))
                            if expandedZone == zone {
                                Text(summaries[zone])
                                    .font(.subheadline).foregroundStyle(.secondary)
                                GameArtwork("World\(zone)", ratio: 1.8, label: names[zone] + " original artwork")
                                activities(for: zone)
                            }
                        }
                    }
                    link("slider.horizontal.3", "Grown-Up Corner — comfort & privacy", MammalFamilyGuideView())
                    Text("96 campaign challenges. One offline adventure. Saved on your device.")
                        .font(.footnote).foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity).multilineTextAlignment(.center)
                }
                .padding(18)
            }
        }
        .navigationTitle("One Adventure")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: refreshProgress)
    }

    @ViewBuilder private func activities(for zone: Int) -> some View {
        switch zone {
        case 0:
            link("square.grid.2x2.fill", "Puzzle Pals — matching", PuzzleView())
            link("leaf.fill", "Find seven hidden treasures", ExploreView())
            link("puzzlepiece.extension.fill", "Three Challenge Lab games", MammalChallengeLabView())
        case 1:
            link("pawprint.fill", "Stewart's Biscuit Factory", BiscuitView())
            link("paintpalette.fill", "Decorate the sticker playroom", MammalPlayroomView())
        case 2:
            link("arrow.left.arrow.right", "Mirror Bridge", PawMirrorBridgeView())
            link("waveform", "Middle C — word detective", PolarMiddleCView())
        case 3:
            link("magnifyingglass", "Champ's Snack Trail game", ChampSnackView())
            link("person.3.fill", "Meet Stewart, Finn, Champ and Ace", FamilyView())
        case 4:
            link("music.note", "Ace's Freeze Dance", AceDanceView())
            link("heart.fill", "Kind animal choices", TrustQuizView())
        default:
            link("book.closed.fill", "Family story time", MammalStoryMomentsView())
            link("snowflake", "16 Polar Family chapters", PolarFamilyQuestView())
        }
    }

    private func refreshProgress() {
        let saved = UserDefaults.standard.dictionary(forKey: "mammal.campaign.v3") as? [String: Int] ?? [:]
        campaignCount = saved.filter { item in
            guard let id = Int(item.key), (1...48).contains(id) else { return false }
            return (1...3).contains(item.value)
        }.count
    }

    private func link<D: View>(_ symbol: String, _ title: String, _ destination: D) -> some View {
        NavigationLink(destination: destination) {
            HStack(spacing: 11) {
                Image(systemName: symbol).foregroundStyle(.teal).frame(width: 28)
                Text(title).font(.subheadline.weight(.semibold))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
                Image(systemName: "chevron.right").foregroundStyle(.teal)
            }
            .padding(13)
            .frame(maxWidth: .infinity, minHeight: 48)
            .background(Color.teal.opacity(0.09), in: RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(.plain)
    }
}
