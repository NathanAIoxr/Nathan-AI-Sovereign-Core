import SwiftUI

/// One entry to the complete game. All former home shortcuts live on the adventure map.
struct GameHomeView: View {
    @EnvironmentObject private var progress: MammalProgress
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        NavigationStack {
            GameBackground {
                ScrollViewReader { scroll in
                    ScrollView {
                        VStack(alignment: .leading, spacing: 17) {
                            HStack(alignment: .center, spacing: 10) {
                                Text("Stewart & Mr. Finn")
                                    .font(.system(.title, design: .rounded, weight: .black))
                                    .fixedSize(horizontal: false, vertical: true)
                                Spacer(minLength: 4)
                                StarCount()
                            }
                            VStack(spacing: 12) {
                                NavigationLink(destination: UnifiedAdventureView()) {
                                    HStack {
                                        Image(systemName: "play.fill")
                                        Text("Play")
                                        Spacer(minLength: 8)
                                        Image(systemName: "arrow.right")
                                    }
                                    .font(.headline)
                                    .padding(16)
                                    .frame(maxWidth: .infinity, minHeight: 52)
                                    .foregroundStyle(.white)
                                    .background(Color.teal, in: RoundedRectangle(cornerRadius: 18))
                                }
                                .buttonStyle(.plain)
                                .accessibilityIdentifier("home.play")

                                Text("One adventure. Your pace.")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                GameArtwork("CatHeroes", ratio: 1.9,
                                            label: "Original artwork of Stewart and Mr. Finn together")
                            }
                            .padding(14)
                            .background(.white, in: RoundedRectangle(cornerRadius: 24))

                            VStack(alignment: .leading, spacing: 9) {
                                Text("Choose your cat").font(.title3.bold())
                                if typeSize.isAccessibilitySize {
                                    VStack(spacing: 9) { catChoices }
                                } else {
                                    HStack(alignment: .top, spacing: 10) { catChoices }
                                }
                            }
                            .id("partners")

                            NavigationLink(destination: MammalFamilyGuideView()) {
                                Label("Grown-Up Corner", systemImage: "slider.horizontal.3")
                                    .font(.headline)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(16)
                                    .background(.white, in: RoundedRectangle(cornerRadius: 18))
                            }
                            .buttonStyle(.plain)
                            .id("settings")

                            Text("By Nathan Tabor, a Human Mammal")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity)
                        }
                        .padding(.horizontal, 18)
                        .padding(.vertical, 12)
                    }
                    .scrollIndicators(.hidden)
                    .task {
                        #if DEBUG
                        let args = ProcessInfo.processInfo.arguments
                        if let index = args.firstIndex(of: "--qa-scroll"),
                           args.count > index + 1 {
                            try? await Task.sleep(for: .milliseconds(300))
                            scroll.scrollTo(args[index + 1], anchor: .top)
                        }
                        #endif
                    }
                }
            }
            .toolbar(.hidden, for: .navigationBar)
        }
        .tint(.teal)
    }

    @ViewBuilder private var catChoices: some View {
        catChoice("Stewart", detail: "Curious and gentle", image: "StewartPortrait")
        catChoice("Mr. Finn", detail: "Loves puzzles", image: "FinnPortrait")
    }

    private func catChoice(_ name: String, detail: String, image: String) -> some View {
        let selected = progress.chosenCat == name
        return Button {
            MammalHaptics.tap()
            progress.choose(name)
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                if !typeSize.isAccessibilitySize {
                    GameArtwork(image, ratio: 1.25, label: name)
                }
                HStack(spacing: 9) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(name).font(.headline)
                        Text(detail).font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer(minLength: 5)
                    Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                        .foregroundStyle(selected ? Color.teal : .secondary)
                }
            }
            .padding(12)
            .frame(maxWidth: .infinity, minHeight: 54, alignment: .leading)
            .background(.white, in: RoundedRectangle(cornerRadius: 18))
            .overlay(RoundedRectangle(cornerRadius: 18)
                .stroke(selected ? Color.teal : Color.clear, lineWidth: 2))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(name + (selected ? ", selected" : ""))
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}
