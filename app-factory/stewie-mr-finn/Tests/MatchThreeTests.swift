import Foundation

@main struct MatchThreeTests {
    static func main() {
        precondition(MatchThreeStage.total == 96)
        precondition(MatchThreeStage(1).name == "Puzzlewood")
        precondition(MatchThreeStage(48).name == "The Mammal Bond")
        precondition(MatchThreeStage(49).polarChapter == 1)
        precondition(MatchThreeStage(72).polarChapter == 8)
        precondition(MatchThreeStage(73).polarChapter == 9)
        precondition(MatchThreeStage(96).polarChapter == 16)
        var allFirst = MatchThreeSave()
        precondition(allFirst.unlocked(1) && !allFirst.unlocked(2))
        var turnsChecked = 0, clears = 0, boosters = 0
        for level in 1...96 {
            for trial in 1...6 {
                var board = MatchThreeGame(level: level, seed: UInt64(level * 1009 + trial))
                precondition(board.cells.count == 49)
                precondition(board.cells.allSatisfy { (0..<6).contains($0) })
                precondition(!hasMatches(board.cells), "Startup prematch on \(level)")
                precondition(board.hint() != nil, "Unplayable opening on \(level)")
                let initial = board.movesLeft
                precondition(!board.swap(0,0) && board.movesLeft == initial)
                for _ in 0..<90 {
                    if board.won || board.lost { break }
                    guard let (a,b) = board.hint() else { fatalError("Dead board on \(level)") }
                    precondition(board.swap(a,b))
                    precondition(board.cells.count == 49 && board.cells.allSatisfy { (0..<6).contains($0) })
                    precondition(!hasMatches(board.cells), "Unresolved cascade on \(level)")
                    precondition(board.gathered >= 0 && board.score >= 30)
                    if !board.won && !board.lost { precondition(board.hint() != nil) }
                    turnsChecked += 1
                    if board.paws > 0 && !board.won && !board.lost { boosters += 1; precondition(board.paw(at: a)) }
                    if board.rainbows > 0 && !board.won && !board.lost { boosters += 1; precondition(board.rainbow(at: b)) }
                }
                precondition(board.won || board.lost)
                if board.won { clears += 1; precondition((1...3).contains(board.stars)) }
                let saved = MatchThreeSave(ratings: [:], round: (!board.won && !board.lost) ? board : nil)
                let restored = MatchThreeSave.restore(saved.serialized())
                precondition(restored.ratings.isEmpty)
                if restored.round != nil { precondition(restored.round == board) }
            }
        }
        // Play every level sequentially like a novice using hints and earned boosters.
        // Failed rounds are restarted, but completed ratings remain intact.
        var entireStory = MatchThreeSave()
        var tries = 0
        for level in 1...96 {
            precondition(entireStory.unlocked(level), "Level \(level) never unlocked")
            var finished = false
            for attempt in 1...20 {
                tries += 1
                var game = MatchThreeGame(level: level, seed: UInt64(level * 12503 + attempt), extraMoves: 14)
                for _ in 0..<60 {
                    if game.won || game.lost { break }
                    guard let move = game.hint() else { fatalError("Novice found no legal swap") }
                    precondition(game.swap(move.0,move.1))
                    if !game.won && !game.lost && game.paws > 0 { precondition(game.paw(at: move.0)) }
                    if !game.won && !game.lost && game.rainbows > 0 { precondition(game.rainbow(at: move.1)) }
                    if !game.won && !game.lost {
                        let paused = MatchThreeSave(ratings: entireStory.ratings, round: game)
                        precondition(MatchThreeSave.restore(paused.serialized()).round == game,
                                     "Every paused round must resume exactly")
                    }
                }
                if game.won {
                    entireStory.finish(game)
                    precondition(entireStory.unlocked(min(level + 1, 96)))
                    finished = true
                    break
                }
            }
            precondition(finished, "Novice could not finish stage \(level) after twenty tries")
        }
        precondition(entireStory.completed == 96 && entireStory.next == 96)
        precondition(MatchThreeSave.restore(entireStory.serialized()).completed == 96)
        for style in MatchThreeComfort.allCases {
            let board = MatchThreeGame(level: 1, seed: 42, extraMoves: style.extraMoves)
            precondition(board.movesLeft == MatchThreeStage(1).moves + style.extraMoves)
            precondition(board.hint() != nil && !hasMatches(board.cells))
        }
        precondition(turnsChecked > 100)
        precondition(clears > 0)
        precondition(boosters > 0)
        var fakeGame = MatchThreeGame(level: 1, seed: 123)
        fakeGame.gathered = fakeGame.goal
        allFirst.finish(fakeGame)
        precondition(allFirst.unlocked(2) && allFirst.ratings[1] != nil)
        let persisted = MatchThreeSave.restore(allFirst.serialized())
        precondition(persisted.ratings[1] == allFirst.ratings[1])
        precondition(!MatchThreeSave.restore("bad JSON").unlocked(2))
        print("MatchThree tests passed: 96 stages × 6 seeds; \(turnsChecked) legal turns; \(clears) clears; \(boosters) boosters; 96-level novice campaign in \(tries) rounds")
    }

    private static func hasMatches(_ cells: [Int]) -> Bool {
        for r in 0..<7 {
            for c in 0..<7 {
                let i = r*7+c
                if c < 5 && cells[i] == cells[i+1] && cells[i] == cells[i+2] { return true }
                if r < 5 && cells[i] == cells[i+7] && cells[i] == cells[i+14] { return true }
            }
        }
        return false
    }
}