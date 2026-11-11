import SwiftUI

/// A calm, offline, open-ended play space: no streaks, ads, or pressure.
struct MammalPlayroomView: View {
    @AppStorage("mammal.playroom.world.v4") private var worldIndex = 0
    @AppStorage("mammal.playroom.stickers.v4") private var stickerData = ""
    @State private var selectedSticker = "🐾"
    @State private var stickers: [Int: String] = [:]
    @State private var feedback = "Choose a sticker, then tap anywhere on the board."
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private let worlds: [(name: String, art: String, color: Color)] = [
        ("Puzzlewood", "World0", .mint),
        ("Biscuit Hollow", "World1", .orange),
        ("Mirror Maze", "World2", .indigo),
        ("Champ's Trail", "World3", .brown),
        ("Ace's Meadow", "World4", .purple),
        ("Mammal Bond", "World5", .pink)
    ]
    private let palette = ["🐾", "🧩", "🍪", "⭐", "🌼", "🦋", "❤️", "🌳", "🎀", "🪶", "🐈", "🐕"]

    var body: some View {
        GameBackground {
            ScrollView {
                VStack(spacing: 16) {
                    StoryHeading(title: "The Mammal Playroom", subtitle: "Build your own gentle adventure. No timers. No wrong answers.")
                    GameCard {
                        Text("Choose a world").font(.headline)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(worlds.indices, id: \.self) { index in
                                    Button {
                                        worldIndex = index
                                        feedback = "Welcome to \(worlds[index].name)!"
                                    } label: {
                                        Text(worlds[index].name)
                                            .font(.subheadline.bold()).padding(12)
                                            .foregroundStyle(index == worldIndex ? .white : .primary)
                                            .background(index == worldIndex ? Color.teal : Color.gray.opacity(0.12), in: Capsule())
                                    }
                                    .accessibilityAddTraits(index == worldIndex ? .isSelected : [])
                                }
                            }
                        }
                    }
                    GameCard {
                        GameArtwork(worlds[worldIndex].art, ratio: 1.5)
                            .accessibilityHidden(true)
                        Text("Tap a square to place your decoration").font(.headline).multilineTextAlignment(.center)
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 8) {
                            ForEach(0..<9, id: \.self) { cell in
                                Button {
                                    stickers[cell] = selectedSticker
                                    persist()
                                    feedback = "Lovely! Your world is growing."
                                } label: {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 16)
                                            .fill(worlds[worldIndex].color.opacity(0.17))
                                        Text(stickers[cell] ?? "＋")
                                            .font(.system(size: 40))
                                    }
                                    .frame(height: 86)
                                }
                                .accessibilityLabel("Garden space \(cell+1), \(stickers[cell] ?? "empty"). Place \(selectedSticker)")
                            }
                        }
                        .animation(reduceMotion ? nil : .easeInOut(duration: 0.18), value: stickers)
                        Text(feedback).font(.footnote).multilineTextAlignment(.center)
                        HStack {
                            Button("Start fresh") { stickers = [:]; persist(); feedback = "A fresh canvas!" }
                                .buttonStyle(.bordered)
                            Button("Undo last") {
                                if let last = stickers.keys.max() {
                                    stickers.removeValue(forKey: last); persist()
                                }
                            }.buttonStyle(.bordered)
                        }
                    }
                    GameCard {
                        Text("Your sticker box").font(.headline)
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 48), spacing: 8)], spacing: 8) {
                            ForEach(palette, id: \.self) { sticker in
                                Button { selectedSticker = sticker } label: {
                                    Text(sticker).font(.system(size: 30))
                                        .frame(maxWidth: .infinity).frame(height: 50)
                                        .background(selectedSticker == sticker ? Color.mint.opacity(0.6) : Color.gray.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                                }
                                .accessibilityLabel("Choose \(sticker) sticker")
                                .accessibilityAddTraits(selectedSticker == sticker ? .isSelected : [])
                            }
                        }
                        Text("Your creations stay on this iPhone. No uploading or sharing.")
                            .font(.caption).foregroundStyle(.secondary).multilineTextAlignment(.center)
                    }
                    NavigationLink(destination: MammalStoryMomentsView()) {
                        Label("Play a mammal story", systemImage: "book.pages.fill")
                            .font(.headline).frame(maxWidth: .infinity).padding(17)
                            .foregroundStyle(.white)
                            .background(.teal, in: RoundedRectangle(cornerRadius: 18))
                    }
                }.padding(18)
            }
        }
        .navigationTitle("Playroom").navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: restore)
    }
    private func persist() {
        stickerData = stickers.map { "\($0.key):\($0.value)" }.sorted().joined(separator: "|")
    }
    private func restore() {
        var current: [Int:String] = [:]
        for pair in stickerData.split(separator: "|") {
            let bits = pair.split(separator: ":", maxSplits: 1)
            if bits.count == 2, let index = Int(bits[0]), (0..<9).contains(index) {
                current[index] = String(bits[1])
            }
        }
        stickers = current
    }
}

private struct StoryMoment {
    let title: String
    let text: String
    let left: String
    let right: String
    let response: String
}

struct MammalStoryMomentsView: View {
    @State private var chapter = 0
    @State private var response: String?
    private let moments: [StoryMoment] = [
        .init(title: "Stewie's Biscuit Factory",
              text: "Stewie climbs onto your chest and starts purring. His paws make biscuits. Then he moves away when you touch his ear.",
              left: "Give him space", right: "Watch quietly",
              response: "Stewie chooses his cuddles. Respecting his choice builds trust."),
        .init(title: "Mr. Finn's Puzzle",
              text: "Mr. Finn and Stewie have almost opposite black-and-white patches. Stewie's white splits his black.",
              left: "Look for patterns", right: "Let the cats rest",
              response: "Two different cats can fit beautifully into one family."),
        .init(title: "Champ's Sleeve Inspection",
              text: "Champ the long-legged tan hound thinks you're hiding food in your sleeves!",
              left: "Ask an adult about treats", right: "Show empty sleeves",
              response: "Champ loves snacks, but adults should choose safe foods."),
        .init(title: "Ace's Freeze",
              text: "Ace the long-haired Australian Shepherd freezes, turns his right foot out and shakes when he hears his name.",
              left: "Watch his whole body", right: "Give Ace room",
              response: "Animals may be excited or worried. Never force a greeting."),
        .init(title: "The Mammal Bond",
              text: "A mammal learns from your words and your actions. Can your mammal trust you?",
              left: "Keep your promises", right: "Listen with kindness",
              response: "Trust grows when you are consistent, gentle and patient.")
    ]
    var body: some View {
        GameBackground {
            ScrollView {
                VStack(spacing: 16) {
                    StoryHeading(title: "Mammal Story Time", subtitle: "Five family moments. Two kind ways forward.")
                    GameCard {
                        Text("STORY \(chapter + 1) OF \(moments.count)").font(.caption.bold()).foregroundStyle(.teal)
                        ProgressView(value: Double(chapter + 1), total: Double(moments.count))
                        Text(moments[chapter].title).font(.title2.bold())
                        Text(moments[chapter].text).font(.title3).multilineTextAlignment(.center).padding(.vertical, 10)
                        if let response {
                            Text(response).font(.body).multilineTextAlignment(.center)
                            PawButton(title: chapter == moments.count - 1 ? "Read again" : "Next story", symbol: "arrow.right") {
                                chapter = (chapter + 1) % moments.count
                                self.response = nil
                            }
                        } else {
                            PawButton(title: moments[chapter].left, symbol: "heart.fill") { respond() }
                            PawButton(title: moments[chapter].right, symbol: "pawprint.fill") { respond() }
                        }
                    }
                    Text("Gentle choices matter more than high scores.")
                        .font(.footnote).foregroundStyle(.secondary)
                }.padding(18)
            }
        }
        .navigationTitle("Story Time").navigationBarTitleDisplayMode(.inline)
    }
    private func respond() { response = moments[chapter].response }
}

struct MammalFamilyGuideView: View {
    @AppStorage("mammal.sound.v4") private var soundEnabled = true
    @AppStorage("mammal.motion.v4") private var motionEnabled = true
    var body: some View {
        GameBackground {
            ScrollView {
                VStack(spacing: 14) {
                    StoryHeading(title: "Grown-Up Corner", subtitle: "A safe space for little mammals and their families.")
                    GameCard {
                        Text("Made for joyful, unhurried play").font(.title3.bold())
                        Text("Play together. Talk about how Champ, Ace, Stewie and Mr. Finn communicate without human words. Let children pause whenever they like.")
                        Toggle("Allow gentle visual motion", isOn: $motionEnabled)
                        Toggle("Sound when available", isOn: $soundEnabled)
                        Text("This game is playable offline. It has no ads, accounts, chat, purchases, or third-party trackers. Game progress stays locally on the device; deleting the app may erase it.")
                            .font(.footnote)
                        Text("All pets are different. Never encourage children to approach unfamiliar animals without a trusted adult.")
                            .font(.footnote)
                    }
                    GameCard {
                        Text("Privacy").font(.headline)
                        Text("Stewart & Mr. Finn stores game progress, choices, stickers, and comfort settings on this device. The app does not transmit this information to Nathan Tabor or third parties. It includes no advertising, analytics, account creation, chat, or purchases. It does not request access to contacts, location, camera, or microphone. Removing the app may erase local progress; device backups are managed by your Apple settings.")
                    }
                    GameCard {
                        Text("Conversation starters").font(.headline)
                        Text("• What does a cat's slow blink sometimes mean?\n• Why should we leave an animal alone when it walks away?\n• Can you be trusted to keep a promise?\n• What makes Champ and Ace different?")
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }.padding(18)
            }
        }
        .navigationTitle("Grown-Up Corner").navigationBarTitleDisplayMode(.inline)
    }
}
