import Foundation

// Stewart & Mr. Finn — a single 96-stage, offline match-3 adventure.
// New save domain: existing Quest, Polar, stickers, and rewards remain untouched.
/// Play styles suit different comfort levels, never an age gate.
/// The chosen move count is embedded in each saved board, so an interrupted
/// round does not change when a preference is adjusted.
enum MatchThreeComfort: String, CaseIterable, Identifiable {
    case gentle, classic, challenge
    var id: String { rawValue }
    var title: String {
        switch self {
        case .gentle: return "Gentle"
        case .classic: return "Classic"
        case .challenge: return "Challenge"
        }
    }
    var extraMoves: Int {
        switch self {
        case .gentle: return 14
        case .classic: return 0
        case .challenge: return -7
        }
    }
    var description: String {
        switch self {
        case .gentle: return "More moves to explore and learn"
        case .classic: return "The original puzzle balance"
        case .challenge: return "Fewer moves for puzzle experts"
        }
    }
    static func restored(_ raw: String) -> Self { Self(rawValue: raw) ?? .classic }
}

struct MatchThreeStage {
    static let total = 96
    static let width = 7
    static let symbols = ["🐾", "🍪", "🧩", "❤️", "⭐", "❄️"]
    static let names = ["Paws", "Biscuits", "Puzzle pieces", "Hearts", "Stars", "Snowflakes"]
    static let worlds = ["Puzzlewood", "Biscuit Hollow", "Finn's Mirror Maze", "Champ's Snack Trail", "Ace's Moonlit Meadow", "The Mammal Bond"]

    let id: Int
    init(_ id: Int) { self.id = min(Self.total, max(1, id)) }
    var target: Int { ((id - 1) / 8 + id) % Self.symbols.count }
    var required: Int { 15 + (id % 4) * 2 }
    var moves: Int { 29 + (id % 5) }
    var polarChapter: Int? { id > 48 ? (id - 49) / 3 + 1 : nil }
    var name: String {
        if let ch = polarChapter { return PolarFamilyCatalog.chapter(ch)?.title ?? "Polar Family" }
        return Self.worlds[(id - 1) / 8]
    }
    var story: String {
        if let ch = polarChapter { return PolarFamilyCatalog.chapter(ch)?.story ?? "" }
        return [
            "A world of hidden pathways and puzzle cats",
            "Stewie's soft paws and patient friendships",
            "Two cats, complementary puzzle-piece coats",
            "Find clues with our long-legged food detective",
            "Playful listening and calm choices",
            "Keep your word, respect boundaries, grow together"
        ][(id - 1) / 8]
    }
    var discovery: String? {
        guard let ch = polarChapter, let chapter = PolarFamilyCatalog.chapter(ch) else { return nil }
        let puzzle = chapter.puzzles[(id - 49) % 3]
        return puzzle.question + "\n" + puzzle.options[puzzle.correct] + ". " + puzzle.explanation
    }
    var stageLabel: String {
        if id <= 48 { return "Board \((id - 1) % 8 + 1) of 8" }
        return "Challenge \((id - 49) % 3 + 1) of 3"
    }
    var image: String {
        if id <= 48 { return "World\((id - 1) / 8)" }
        return id <= 72 ? "NorthPaw" : "Workshop"
    }
}

struct MatchThreeGame: Codable, Equatable {
    static let side = 7
    static let count = side * side
    let level: Int
    var cells: [Int]
    var movesLeft: Int
    var gathered = 0
    var score = 0
    var paws = 0
    var rainbows = 0
    var rng: UInt64
    var won: Bool { gathered >= MatchThreeStage(level).required }
    var lost: Bool { movesLeft <= 0 && !won }
    var target: Int { MatchThreeStage(level).target }
    var goal: Int { MatchThreeStage(level).required }
    var stars: Int { won ? (movesLeft >= 12 ? 3 : movesLeft >= 5 ? 2 : 1) : 0 }

    init(level: Int, seed: UInt64 = UInt64.random(in: 1...UInt64.max), extraMoves: Int = 0) {
        let stage = MatchThreeStage(level)
        self.level = stage.id
        self.cells = []
        self.movesLeft = max(10, stage.moves + min(14, max(-7, extraMoves)))
        self.rng = seed == 0 ? 0x9e3779b97f4a7c15 : seed
        freshBoard()
    }

    private mutating func randomTile() -> Int {
        rng ^= rng << 13
        rng ^= rng >> 7
        rng ^= rng << 17
        return Int(rng % UInt64(MatchThreeStage.symbols.count))
    }

    private mutating func freshBoard() {
        for _ in 0..<400 {
            cells = Array(repeating: 0, count: Self.count)
            for i in 0..<Self.count {
                let row = i / Self.side, col = i % Self.side
                var candidates = Array(0..<MatchThreeStage.symbols.count)
                if col >= 2 && cells[i-1] == cells[i-2] { candidates.removeAll { $0 == cells[i-1] } }
                if row >= 2 && cells[i-Self.side] == cells[i-2*Self.side] { candidates.removeAll { $0 == cells[i-Self.side] } }
                cells[i] = candidates[randomTile() % candidates.count]
            }
            if hint() != nil { return }
        }
        cells = (0..<Self.count).map { (($0 / Self.side) + ($0 % Self.side) * 2) % 6 }
        cells[0] = 1; cells[1] = 0; cells[2] = 1; cells[Self.side+1] = 1
        if hint() == nil { freshBoard() }
    }

    private func neighbors(_ a: Int, _ b: Int) -> Bool {
        guard (0..<Self.count).contains(a), (0..<Self.count).contains(b) else { return false }
        return (a / Self.side == b / Self.side && abs(a-b) == 1) || abs(a-b) == Self.side
    }

    private static func runs(_ tiles: [Int]) -> [[Int]] {
        var result: [[Int]] = []
        for row in 0..<side {
            var c = 0
            while c < side {
                let start = c, v = tiles[row * side + c]
                while c < side && tiles[row * side + c] == v { c += 1 }
                if v >= 0 && c - start >= 3 { result.append((start..<c).map { row * side + $0 }) }
            }
        }
        for col in 0..<side {
            var r = 0
            while r < side {
                let start = r, v = tiles[r * side + col]
                while r < side && tiles[r * side + col] == v { r += 1 }
                if v >= 0 && r - start >= 3 { result.append((start..<r).map { $0 * side + col }) }
            }
        }
        return result
    }

    func hint() -> (Int, Int)? {
        for a in 0..<Self.count {
            let row = a / Self.side, col = a % Self.side
            for b in [col < Self.side-1 ? a+1 : -1, row < Self.side-1 ? a+Self.side : -1] where b >= 0 {
                if cells[a] == cells[b] { continue }
                var tentative = cells
                tentative.swapAt(a, b)
                if !Self.runs(tentative).isEmpty { return (a,b) }
            }
        }
        return nil
    }

    @discardableResult mutating func swap(_ a: Int, _ b: Int) -> Bool {
        guard !won, !lost, neighbors(a,b), cells[a] != cells[b] else { return false }
        cells.swapAt(a,b)
        guard !Self.runs(cells).isEmpty else {
            cells.swapAt(a,b)
            return false
        }
        movesLeft -= 1
        resolveMatches()
        if !won && !lost { ensurePlayable() }
        return true
    }

    @discardableResult mutating func paw(at index: Int) -> Bool {
        guard paws > 0, !won, !lost, (0..<Self.count).contains(index) else { return false }
        paws -= 1
        let row = index / Self.side
        remove(Set((0..<Self.side).map { row * Self.side + $0 }), multiplier: 1)
        resolveMatches()
        if !won && !lost { ensurePlayable() }
        return true
    }

    @discardableResult mutating func rainbow(at index: Int) -> Bool {
        guard rainbows > 0, !won, !lost, (0..<Self.count).contains(index) else { return false }
        rainbows -= 1
        let kind = cells[index]
        let positions = Set(cells.indices.filter { cells[$0] == kind })
        remove(positions, multiplier: 1)
        resolveMatches()
        if !won && !lost { ensurePlayable() }
        return true
    }

    private mutating func resolveMatches() {
        for chain in 1...100 {
            let matches = Self.runs(cells)
            if matches.isEmpty { break }
            if matches.contains(where: { $0.count >= 5 }) { rainbows += 1 }
            else if matches.contains(where: { $0.count >= 4 }) { paws += 1 }
            remove(Set(matches.flatMap { $0 }), multiplier: min(chain, 5))
        }
    }

    private mutating func remove(_ positions: Set<Int>, multiplier: Int) {
        guard !positions.isEmpty else { return }
        for index in positions {
            if cells[index] == target { gathered += 1 }
            score += 10 * multiplier
            cells[index] = -1
        }
        for col in 0..<Self.side {
            let survivors = (0..<Self.side).reversed().compactMap { row -> Int? in
                let value = cells[row * Self.side + col]
                return value >= 0 ? value : nil
            }
            for row in (0..<Self.side).reversed() {
                let fromBottom = Self.side - 1 - row
                cells[row * Self.side + col] = fromBottom < survivors.count ? survivors[fromBottom] : randomTile()
            }
        }
    }

    private mutating func ensurePlayable() {
        guard hint() == nil else { return }
        let original = cells
        for _ in 0..<400 {
            cells = original
            for i in stride(from: Self.count-1, through: 1, by: -1) {
                cells.swapAt(i, randomTile() % (i+1))
            }
            if Self.runs(cells).isEmpty && hint() != nil { return }
        }
        freshBoard()
    }
}

struct MatchThreeSave: Codable {
    var ratings: [Int: Int] = [:]
    var round: MatchThreeGame?
    var completed: Int { (1...MatchThreeStage.total).filter { (ratings[$0] ?? 0) > 0 }.count }
    var next: Int { (1...MatchThreeStage.total).first { (ratings[$0] ?? 0) == 0 } ?? MatchThreeStage.total }
    func unlocked(_ level: Int) -> Bool {
        (1...MatchThreeStage.total).contains(level) && (level == 1 || (ratings[level - 1] ?? 0) > 0)
    }
    mutating func finish(_ game: MatchThreeGame) {
        guard game.won, unlocked(game.level) else { return }
        ratings[game.level] = max(ratings[game.level] ?? 0, game.stars)
        round = nil
    }
    static func restore(_ string: String) -> MatchThreeSave {
        guard let data = string.data(using: .utf8),
              let decoded = try? JSONDecoder().decode(MatchThreeSave.self, from: data) else { return .init() }
        let validRatings = decoded.ratings.filter { (1...MatchThreeStage.total).contains($0.key) && (1...3).contains($0.value) }
        var fixed = MatchThreeSave(ratings: validRatings, round: nil)
        if let board = decoded.round, (1...MatchThreeStage.total).contains(board.level),
           fixed.unlocked(board.level), board.cells.count == MatchThreeGame.count,
           board.cells.allSatisfy({ (0..<MatchThreeStage.symbols.count).contains($0) }),
           !board.won && !board.lost, board.movesLeft > 0,
           board.gathered >= 0, board.gathered < board.goal,
           board.paws >= 0, board.rainbows >= 0, board.score >= 0 {
            fixed.round = board
        }
        return fixed
    }
    func serialized() -> String {
        guard let data = try? JSONEncoder().encode(self) else { return "" }
        return String(data: data, encoding: .utf8) ?? ""
    }
}