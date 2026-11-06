import SwiftUI

/// One match-3 campaign: six original worlds and the 16 Polar Family chapters.
/// Legacy originals and their saved progress are retained in the optional library.
struct MatchThreeAdventureView: View {
    @AppStorage("mammal.match3.v1") private var saved = ""
    @AppStorage("mammal.pace.v1") private var paceValue = GamePace.steady.rawValue
    @AppStorage("mammal.match3.comfort.v1") private var comfortValue = MatchThreeComfort.classic.rawValue
    private var progress: MatchThreeSave { .restore(saved) }
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 7), count: 4)

    var body: some View {
        GameBackground {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    StoryHeading(title: "STEWART & MR. FINN", subtitle: "ONE GREAT MATCH-3 ADVENTURE")
                    GameArtwork("CatHeroes", ratio: 2.2, label: "Original portraits of Stewart and Mr. Finn")
                    GameCard {
                        Text("96 connected levels · one game").font(.title3.bold())
                        ProgressView(value: Double(progress.completed), total: 96).tint(.teal)
                        Text("\(progress.completed) of 96 cleared").font(.subheadline.monospacedDigit())
                        NavigationLink(destination: MatchThreeLevelView(level: progress.next)) {
                            Label(progress.completed == 96 ? "Replay the grand finale" : "Play level \(progress.next)", systemImage: "play.fill")
                                .font(.headline)
                                .frame(maxWidth: .infinity, minHeight: 54)
                                .foregroundStyle(.white)
                                .background(.teal, in: RoundedRectangle(cornerRadius: 16))
                        }
                        .buttonStyle(.plain)
                        Text("Swap neighboring pieces. Match 3 or more. Collect the goal before moves run out. Four-match and five-match combos earn boosters. No clock and no purchases.")
                            .font(.footnote).foregroundStyle(.secondary)
                    }
                    GameCard {
                        Text("Play your way — every age, every skill level")
                            .font(.headline)
                        Picker("Challenge level", selection: $comfortValue) {
                            ForEach(MatchThreeComfort.allCases) { mode in
                                Text(mode.title).tag(mode.rawValue)
                            }
                        }
                        .pickerStyle(.segmented)
                        .accessibilityIdentifier("match3.comfort")
                        Text(MatchThreeComfort.restored(comfortValue).description +
                             ". Your choice applies to new rounds, never changing an unfinished board.")
                            .font(.footnote).foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    GameCard {
                        HStack {
                            Label("Play pace", systemImage: "speedometer")
                            Spacer()
                            Picker("Play pace", selection: $paceValue) {
                                ForEach(GamePace.allCases) { option in Text(option.title).tag(option.rawValue) }
                            }
                            .pickerStyle(.menu)
                        }
                        Text("Calm, Steady, and Quick change presentation only; nobody is timed.")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    ForEach(0..<6, id: \.self) { world in
                        levelSection(title: MatchThreeStage.worlds[world],
                                     subtitle: "Levels \(world * 8 + 1)–\(world * 8 + 8)",
                                     image: "World\(world)",
                                     ids: Array((world*8+1)...(world*8+8)))
                    }
                    levelSection(title: "NORTH PAW · HO HO HO",
                                 subtitle: "Polar chapters 1–8 · levels 49–72",
                                 image: "NorthPaw", ids: Array(49...72))
                    levelSection(title: "MRS CLAUSE CAT'S WORKSHOP · OH OH OH",
                                 subtitle: "Polar chapters 9–16 · levels 73–96",
                                 image: "Workshop", ids: Array(73...96))
                    GameCard {
                        Text("Original adventure library").font(.headline)
                        Text("Your earlier 48 quest boards, 16 Polar chapters, stories, stickers, games and their original progress remain available and unchanged.")
                            .font(.footnote).foregroundStyle(.secondary)
                        NavigationLink(destination: UnifiedAdventureView()) {
                            Label("View original adventures", systemImage: "books.vertical")
                                .font(.subheadline.bold()).frame(maxWidth: .infinity, minHeight: 44)
                        }
                    }
                    Text("Original characters and artwork by Nathan Tabor · Offline · Private on this device")
                        .font(.caption).foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity).multilineTextAlignment(.center)
                }
                .padding(17)
            }
        }
        .navigationTitle("Match-3 Adventure")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func levelSection(title: String, subtitle: String, image: String, ids: [Int]) -> some View {
        GameCard {
            GameArtwork(image, ratio: 2.6, label: "Original artwork for \(title)")
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(.headline)
                    Text(subtitle).font(.caption).foregroundStyle(.secondary)
                }
                Spacer(minLength: 4)
                let finished = ids.filter { (progress.ratings[$0] ?? 0) > 0 }.count
                Text("\(finished)/\(ids.count)").font(.caption.bold()).monospacedDigit()
            }
            LazyVGrid(columns: columns, spacing: 7) {
                ForEach(ids, id: \.self) { id in
                    let unlocked = progress.unlocked(id)
                    let stars = progress.ratings[id] ?? 0
                    NavigationLink(destination: MatchThreeLevelView(level: id)) {
                        VStack(spacing: 3) {
                            Image(systemName: unlocked ? "pawprint.fill" : "lock.fill").font(.subheadline)
                            Text("\(id)").font(.headline.monospacedDigit())
                            Text(stars == 0 ? "· · ·" : String(repeating: "★", count: stars))
                                .font(.system(size: 10)).foregroundStyle(.orange)
                        }
                        .frame(maxWidth: .infinity, minHeight: 66)
                        .foregroundStyle(unlocked ? Color.teal : .gray)
                        .background(unlocked ? Color.teal.opacity(0.12) : Color.gray.opacity(0.08),
                                    in: RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(!unlocked)
                    .accessibilityLabel("Level \(id), \(unlocked ? "available" : "locked"), \(stars) stars")
                }
            }
        }
    }
}

struct MatchThreeLevelView: View {
    let level: Int
    @EnvironmentObject private var overallProgress: MammalProgress
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var textSize
    @AppStorage("mammal.match3.v1") private var saved = ""
    @AppStorage("mammal.pace.v1") private var paceValue = GamePace.steady.rawValue
    @AppStorage("mammal.match3.comfort.v1") private var comfortValue = MatchThreeComfort.classic.rawValue
    @State private var game: MatchThreeGame?
    @State private var selected: Int?
    @State private var hintPartner: Int?
    @State private var armed: String?
    @State private var message = "Tap two neighbors or swipe a piece to make a match."
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 3), count: 7)
    private let backgrounds: [Color] = [.teal, .orange, .indigo, .pink, .yellow, .cyan]
    private var stage: MatchThreeStage { MatchThreeStage(level) }

    var body: some View {
        GameBackground {
            ScrollView {
                VStack(spacing: 12) {
                    HStack(spacing: 8) {
                        Text("LEVEL \(level)").font(.title2.bold())
                        Spacer(minLength: 2)
                        Text(stage.stageLabel).font(.caption.bold()).foregroundStyle(.secondary)
                    }
                    Text(stage.name).font(.headline).multilineTextAlignment(.center)
                    if let game {
                        GameCard {
                            HStack(spacing: 8) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("COLLECT").font(.caption2.bold()).foregroundStyle(.secondary)
                                    Text("\(MatchThreeStage.symbols[game.target]) \(min(game.gathered, game.goal)) / \(game.goal)")
                                        .font(.title3.bold()).monospacedDigit()
                                        .lineLimit(1).minimumScaleFactor(0.65)
                                        .accessibilityIdentifier("match3.goal")
                                }
                                Spacer(minLength: 3)
                                VStack(alignment: .trailing, spacing: 2) {
                                    Text("MOVES LEFT").font(.caption2.bold()).foregroundStyle(.secondary)
                                    Text("\(game.movesLeft)").font(.title3.bold()).monospacedDigit()
                                        .accessibilityIdentifier("match3.moves")
                                }
                            }
                            ProgressView(value: Double(min(game.gathered,game.goal)), total: Double(game.goal)).tint(.teal)
                            LazyVGrid(columns: columns, spacing: 3) {
                                ForEach(game.cells.indices, id: \.self) { index in
                                    tile(index, value: game.cells[index])
                                }
                            }
                            .accessibilityIdentifier("match3.board")
                            if textSize.isAccessibilitySize {
                                VStack(alignment: .leading, spacing: 5) {
                                    Text("Select a tile, then choose a direction")
                                        .font(.footnote.bold())
                                    HStack(spacing: 7) {
                                        directionButton("left", icon: "arrow.left", offset: -1)
                                        directionButton("up", icon: "arrow.up", offset: -7)
                                        directionButton("down", icon: "arrow.down", offset: 7)
                                        directionButton("right", icon: "arrow.right", offset: 1)
                                    }
                                }
                            }
                            Text(message)
                                .font(.footnote.weight(.medium))
                                .multilineTextAlignment(.center)
                                .frame(maxWidth: .infinity, minHeight: 32)
                            HStack(spacing: 8) {
                                boostButton(symbol: "🐾", title: "Paw \(game.paws)", key: "paw", available: game.paws > 0)
                                boostButton(symbol: "🌈", title: "Rainbow \(game.rainbows)", key: "rainbow", available: game.rainbows > 0)
                                Button { showHint() } label: {
                                    Label("Hint", systemImage: "lightbulb")
                                        .font(.caption.bold()).frame(maxWidth: .infinity, minHeight: 45)
                                }
                                .buttonStyle(.bordered).disabled(game.won || game.lost)
                                .accessibilityIdentifier("match3.hint")
                            }
                            Text("Score \(game.score) · Swap adjacent pieces · Match 4 for a paw / 5 for a rainbow")
                                .font(.caption2).foregroundStyle(.secondary).multilineTextAlignment(.center)
                        }
                        // Put gameplay first on small screens and with large text:
                        // Story and instructions remain readable below the board.
                        VStack(alignment: .leading, spacing: 6) {
                            Text("MATCH 3 OR MORE • TAP TWO NEIGHBORS OR SWIPE")
                                .font(.subheadline.bold())
                                .accessibilityIdentifier("match3.instructions")
                            Text(stage.story)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 8)
                        if game.won {
                            AwardBanner(title: "Level \(level) clear! \(String(repeating: "★", count: game.stars))")
                            if let discovery = stage.discovery {
                                GameCard {
                                    Text("POLAR DISCOVERY").font(.caption.bold())
                                    Text(discovery).font(.subheadline).multilineTextAlignment(.center)
                                }
                            }
                            if level < MatchThreeStage.total {
                                NavigationLink(destination: MatchThreeLevelView(level: level+1)) {
                                    Label("Next match-3 level", systemImage: "arrow.right.circle.fill")
                                        .frame(maxWidth: .infinity, minHeight: 48).font(.headline)
                                }
                            } else {
                                Text("Stewart and Mr. Finn finished their 96-level adventure together!")
                                    .font(.headline).multilineTextAlignment(.center)
                            }
                            Button("Replay this level") { restart() }
                                .buttonStyle(.bordered)
                                .accessibilityIdentifier("match3.replay")
                        } else if game.lost {
                            Text("Out of moves. Keep your progress and try this level again!")
                                .font(.headline).multilineTextAlignment(.center)
                            PawButton(title: "Try again", symbol: "arrow.clockwise", action: restart)
                        } else {
                            Button("Restart this round") { restart() }
                                .font(.footnote).buttonStyle(.bordered)
                                .accessibilityIdentifier("match3.restart")
                        }
                    }
                    Text("With \(overallProgress.chosenCat) · Take all the thinking time you need.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
                .padding(13)
            }
        }
        .navigationTitle("Match-3 · \(level)")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: load)
    }

    private func tile(_ index: Int, value: Int) -> some View {
        let safe = max(0, min(MatchThreeStage.symbols.count - 1, value))
        return Button { tap(index) } label: {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(backgrounds[safe].opacity(selected == index ? 0.65 : 0.17))
                RoundedRectangle(cornerRadius: 8)
                    .stroke(selected == index ? Color.teal : (hintPartner == index ? Color.orange : .white.opacity(0.9)), lineWidth: (selected == index || hintPartner == index) ? 3 : 1)
                Text(MatchThreeStage.symbols[safe])
                    .font(.system(size: 24)).minimumScaleFactor(0.55).lineLimit(1)
            }
            .aspectRatio(1, contentMode: .fit)
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
        .disabled(game?.won != false || game?.lost != false)
        .accessibilityLabel("Row \(index / 7 + 1), column \(index % 7 + 1), \(MatchThreeStage.names[safe])" + (selected == index ? ", selected" : ""))
        .accessibilityHint("Select a neighboring tile to swap. You may also swipe this tile.")
        .accessibilityIdentifier("match3.tile.\(index)")
        .simultaneousGesture(DragGesture(minimumDistance: 15).onEnded { event in
            let dx = event.translation.width, dy = event.translation.height
            let destination: Int
            if abs(dx) > abs(dy) { destination = index + (dx > 0 ? 1 : -1) }
            else { destination = index + (dy > 0 ? 7 : -7) }
            makeMove(index, destination)
        })
    }

    private func directionButton(_ name: String, icon: String, offset: Int) -> some View {
        Button {
            guard let from = selected else {
                message = "Choose a puzzle tile first, then use a direction."
                return
            }
            makeMove(from, from + offset)
        } label: {
            Image(systemName: icon)
                .font(.headline)
                .frame(maxWidth: .infinity, minHeight: 50)
        }
        .buttonStyle(.bordered)
        .disabled(game?.won != false || game?.lost != false)
        .accessibilityLabel("Swap selected tile \(name)")
        .accessibilityIdentifier("match3.move.\(name)")
    }

    private func boostButton(symbol: String, title: String, key: String, available: Bool) -> some View {
        Button {
            armed = armed == key ? nil : key
            selected = nil
            hintPartner = nil
            message = armed == nil ? "Select two adjacent tiles." : "Choose a tile to use your \(key) booster."
        } label: {
            Text(symbol + " " + title)
                .font(.caption.bold()).lineLimit(1).minimumScaleFactor(0.7)
                .frame(maxWidth: .infinity, minHeight: 45)
                .background(armed == key ? Color.yellow.opacity(0.4) : Color.teal.opacity(0.08),
                            in: RoundedRectangle(cornerRadius: 10))
        }
        .buttonStyle(.plain)
        .disabled(!available || game?.won != false || game?.lost != false)
    }

    private func tap(_ index: Int) {
        guard var next = game, !next.won && !next.lost else { return }
        if let armed {
            let used = armed == "paw" ? next.paw(at: index) : next.rainbow(at: index)
            if used { commit(next); message = "Boost activated!" }
            self.armed = nil; selected = nil
            return
        }
        guard let from = selected else { selected = index; hintPartner = nil; return }
        selected = nil
        hintPartner = nil
        if from != index { makeMove(from, index) }
    }

    private func makeMove(_ a: Int, _ b: Int) {
        guard var next = game, !next.won && !next.lost, armed == nil else { return }
        selected = nil
        hintPartner = nil
        if next.swap(a,b) {
            if reduceMotion {
                commit(next)
            } else {
                withAnimation(.easeInOut(duration: GamePace.restored(paceValue).animationSeconds)) {
                    commit(next)
                }
            }
            message = next.won ? "All pieces collected!" : "Great match! Every piece counts."
        } else {
            message = "Only neighboring pieces that make 3 or more will swap."
        }
    }

    private func showHint() {
        if let positions = game?.hint() {
            selected = positions.0
            hintPartner = positions.1
            message = "Swap row \(positions.0 / 7 + 1), column \(positions.0 % 7 + 1) with row \(positions.1 / 7 + 1), column \(positions.1 % 7 + 1). Both tiles are outlined."
        } else {
            message = "A new playable board will be prepared after your next move."
        }
    }

    private func load() {
        var state = MatchThreeSave.restore(saved)
        guard state.unlocked(level) else { return }
        if let previous = state.savedRound(for: level) {
            game = previous
            message = "Welcome back. Your exact board and moves have been restored."
        } else if game == nil {
            let fresh = MatchThreeGame(level: level, extraMoves: MatchThreeComfort.restored(comfortValue).extraMoves)
            game = fresh
            // Save before the first move; leaving immediately must preserve the board.
            state.saveRound(fresh)
            saved = state.serialized()
        }
    }

    private func restart() {
        let fresh = MatchThreeGame(level: level, extraMoves: MatchThreeComfort.restored(comfortValue).extraMoves)
        game = fresh; selected = nil; hintPartner = nil; armed = nil
        message = "New round. Swap adjacent pieces to collect \(MatchThreeStage.names[fresh.target].lowercased())."
        var state = MatchThreeSave.restore(saved)
        state.saveRound(fresh)
        saved = state.serialized()
    }

    private func commit(_ next: MatchThreeGame) {
        game = next
        var state = MatchThreeSave.restore(saved)
        if next.won {
            state.finish(next)
            overallProgress.win("match3.level.\(next.level)", reward: next.stars * 5)
        } else if next.lost {
            state.removeRound(for: next.level)
        } else {
            state.saveRound(next)
        }
        saved = state.serialized()
    }
}