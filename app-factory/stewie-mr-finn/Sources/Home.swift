import SwiftUI

struct GameHomeView: View {
    @EnvironmentObject private var progress: MammalProgress
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        NavigationStack {
            GameBackground {
                ScrollViewReader { scroll in
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        HStack(alignment: .center) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("PUZZLEWOOD ADVENTURES").font(.caption2.bold()).tracking(1.5)
                                    .foregroundStyle(.secondary)
                                Text("Stewart & Mr. Finn")
                                    .font(.system(.title, design: .rounded, weight: .black))
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            Spacer(minLength: 8)
                            StarCount()
                        }
                        VStack(alignment: .leading, spacing: 14) {
                            if typeSize.isAccessibilitySize { adventureStart }
                            GameArtwork("CatHeroes", ratio: 1.5, label: "Stewart on the left and Mr. Finn on the right, from the original game artwork")
                            Text("Ready for an adventure?")
                                .font(.system(.title2, design: .rounded, weight: .heavy))
                            Text("1. Pick your cat.  2. Play a little.  3. Learn together.\nThere is no timer. You can always try again.")
                                .font(.subheadline).foregroundStyle(.secondary)
                            if !typeSize.isAccessibilitySize { adventureStart }
                        }
                        .padding(14)
                        .background(.white, in: RoundedRectangle(cornerRadius: 28))

                        VStack(alignment: .leading, spacing: 10) {
                            sectionTitle("Your adventure partner", detail: "Choose a cat to explore with")
                            if typeSize.isAccessibilitySize {
                                VStack(spacing: 10) { catChoices }
                            } else {
                                HStack(alignment: .top, spacing: 10) { catChoices }
                            }
                        }.id("partners")

                        VStack(alignment: .leading, spacing: 12) {
                            sectionTitle("A little Christmas magic", detail: "16 chapters · 48 new challenges")
                            NavigationLink(destination: PolarFamilyQuestView()) {
                                VStack(alignment: .leading, spacing: 12) {
                                    GameArtwork("Workshop", ratio: 1.65, label: "Mrs Clause Cat's magical Christmas workshop")
                                    HStack(alignment: .top) {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("The Polar Family").font(.system(.title3, design: .rounded, weight: .heavy))
                                            Text("North Paw & Mrs Clause Cat’s Workshop")
                                                .font(.subheadline).foregroundStyle(.secondary)
                                                .fixedSize(horizontal: false, vertical: true)
                                        }
                                        Spacer(minLength: 8)
                                        Image(systemName: "arrow.up.right").padding(9)
                                            .background(Color.teal.opacity(0.1), in: Circle())
                                    }
                                }.padding(14).background(.white, in: RoundedRectangle(cornerRadius: 24))
                            }.buttonStyle(.plain).accessibilityIdentifier("home.polar")
                        }.id("polar")

                        VStack(alignment: .leading, spacing: 10) {
                            sectionTitle("Something else to play", detail: "Play at your own pace")
                            adventureLink("puzzlepiece.extension.fill", "Quick games", "Match, count, find and explore", to: ActivityShelfView(shelf: .games))
                            adventureLink("heart.fill", "Stories & kindness", "Learn how our animal friends feel", to: ActivityShelfView(shelf: .stories))
                            adventureLink("paintpalette.fill", "Make & move", "Create, bake and dance at your pace", to: ActivityShelfView(shelf: .create))
                            adventureLink("textformat.abc", "Word adventures", "Longer reading puzzles to share with a grown-up", to: ActivityShelfView(shelf: .words))
                        }.id("activities")
                        adventureLink("slider.horizontal.3", "Grown-Up Corner", "Comfort settings, privacy & family tips", to: MammalFamilyGuideView())
                        Text("By Nathan Tabor, a Human Mammal")
                            .font(.footnote).foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity).padding(.vertical, 8)
                    }
                    .padding(.horizontal, 18).padding(.top, 12).padding(.bottom, 24)
                }
                .scrollIndicators(.hidden)
                .task {
                    #if DEBUG
                    let arguments = ProcessInfo.processInfo.arguments
                    if let index = arguments.firstIndex(of: "--qa-scroll"), arguments.count > index + 1 {
                        try? await Task.sleep(for: .milliseconds(300))
                        scroll.scrollTo(arguments[index + 1], anchor: .top)
                    }
                    #endif
                }
                }
            }
            .toolbar(.hidden, for: .navigationBar)
        }.tint(.teal)
    }

    private var adventureStart: some View {
        NavigationLink(destination: UnifiedAdventureView()) {
                    HStack {
                        Image(systemName: "play.fill")
                        Text("Enter my one big adventure")
                        Spacer()
                        Image(systemName: "arrow.right")
                    }
                    .font(.headline).padding(17).foregroundStyle(.white)
                    .background(Color.teal, in: RoundedRectangle(cornerRadius: 18))
                }.buttonStyle(.plain).accessibilityIdentifier("home.play")
    }

    private func sectionTitle(_ title: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.system(.title3, design: .rounded, weight: .heavy))
            Text(detail).font(.subheadline).foregroundStyle(.secondary)
        }
    }
    @ViewBuilder private var catChoices: some View {
        catChoice("Stewart", detail: "Curious and gentle", image: "StewartPortrait")
        catChoice("Mr. Finn", detail: "A friend who loves puzzles", image: "FinnPortrait")
    }
    private func catChoice(_ name: String, detail: String, image: String) -> some View {
        let selected = progress.chosenCat == name
        return Button { MammalHaptics.tap(); progress.choose(name) } label: {
            VStack(alignment: .leading, spacing: 8) {
                GameArtwork(image, ratio: 1.25, label: name)
                HStack {
                    Text(name).font(.headline)
                    Spacer(minLength: 4)
                    Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                        .foregroundStyle(selected ? Color.teal : .secondary)
                }
                Text(detail).font(.caption).foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(12).frame(maxWidth: .infinity, alignment: .leading)
            .background(.white, in: RoundedRectangle(cornerRadius: 20))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(selected ? Color.teal : Color.clear, lineWidth: 2))
        }.buttonStyle(.plain).accessibilityAddTraits(selected ? .isSelected : [])
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
