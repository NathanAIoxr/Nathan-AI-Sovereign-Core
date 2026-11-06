import Foundation

// Compile with:
// swiftc Sources/PolarFamilyQuestCore.swift Tests/main.swift -o /tmp/polar-quest-check
// /tmp/polar-quest-check

func check(_ condition: @autoclosure () -> Bool, _ message: String) {
    guard condition() else {
        fputs("FAIL: \(message)\n", stderr)
        exit(1)
    }
}

check(PolarFamilyCatalog.isValid, "Every chapter has 3 sound/number/mirror/care/nature questions with 4 unique options")
check(PolarFamilyCatalog.chapters.count == 16, "Sixteen original chapters")
check(PolarFamilyCatalog.chapters.flatMap(\.puzzles).count == 48, "Forty-eight unique native puzzles")
check(PolarFamilyCatalog.chapters.filter { $0.region == .north }.count == 8, "Eight North Paw chapters")
check(PolarFamilyCatalog.chapters.filter { $0.region == .south }.count == 8, "Eight Mrs Clause Cat’s Workshop chapters")
check(Set(PolarFamilyCatalog.chapters.flatMap(\.puzzles).map(\.question)).count == 48, "No repeated puzzle text")
check(Set(PolarFamilyCatalog.chapters.flatMap(\.puzzles).map(\.kind)).count == 5, "Five kinds of learning challenge")

var progress = PolarFamilySave()
check(progress.isUnlocked(1), "Board one is open")
check(!progress.isUnlocked(2) && !progress.isUnlocked(16), "Later boards start locked")
check(!progress.isUnlocked(0) && !progress.isUnlocked(17), "No invalid board opens")
progress.complete(chapter: 2, correct: 3)
check(progress.completed == 0, "Cannot skip a locked board")

for id in 1...16 {
    check(progress.isUnlocked(id), "Board \(id) must become available sequentially")
    progress.complete(chapter: id, correct: id % 4)
}
check(progress.completed == 16, "The full native story unlocks")
check(progress.reunionComplete && progress.northComplete && progress.southComplete, "All world achievements are set")
check(progress.completedQuestions == 48, "Every first-time board has 3 questions")
check(progress.ratings[4] == 1, "Participation earns at least one star")
check(progress.ratings[3] == 3, "Three correct answers earn three stars")
check(progress.stars > 16 && progress.stars <= 48, "Stars are bounded")

let originalStars = progress.stars
progress.complete(chapter: 3, correct: 0)
check(progress.stars == originalStars, "Replays never reduce earned stars")
check(progress.completedQuestions == 48, "Replaying does not inflate unique completed-question count")
let serialized = progress.serialized()
check(PolarFamilySave.restored(serialized) == progress, "JSON saves round-trip")
check(PolarFamilySave.restored("{not json").completed == 0, "Corrupted save resets safely")

let malicious = """
{"ratings":{"1":3,"2":9,"4":3,"16":3,"99":100},"completedQuestions":-20}
"""
let clean = PolarFamilySave.restored(malicious)
check(clean.ratings[1] == 3 && clean.ratings.count == 1, "Invalid ratings, skipped boards, or forged final progress are rejected")
check(clean.completedQuestions == 3, "Unique progress is recomputed from the one valid restored chapter")

let northGreeting = PolarFamilyCatalog.chapter(1)!
check(northGreeting.puzzles[1].options[northGreeting.puzzles[1].correct] == "OH", "North gate flips HO to OH")
let firstSwap = PolarFamilyCatalog.chapter(3)!
check(firstSwap.puzzles[1].options[firstSwap.puzzles[1].correct] == "SWAP", "PAWS mirrors to SWAP")
let final = PolarFamilyCatalog.chapter(16)!
check(final.puzzles[2].explanation.contains("angular acceleration"), "Final balance explains physics, not magical cancellation")
print("PASS: 16 native polar chapters, 48 unique questions, 5 challenge types, progression, safety, save/restore, replay, balance.")

var attempt = PolarChapterAttempt()
attempt.next()
check(attempt.advanced == 0, "Cannot advance without answering")
for (index, puzzle) in northGreeting.puzzles.enumerated() {
    attempt.choose(puzzle.correct)
    attempt.choose((puzzle.correct + 1) % 4)
    check(attempt.answers.count == index + 1, "Only the first answer counts")
    attempt = PolarChapterAttempt.restored(attempt.serialized())
    check(attempt.selected == puzzle.correct, "Selected answer survives interruption")
    attempt.next()
    attempt = PolarChapterAttempt.restored(attempt.serialized())
    check(attempt.advanced == index + 1, "Next clue survives interruption")
}
check(attempt.isComplete && attempt.correct(in: northGreeting) == 3, "Restored completion derives score")
attempt.next()
attempt.choose(0)
check(attempt.answers.count == 3 && attempt.advanced == 3, "Completed attempt cannot accumulate answers")
for raw in ["bad", "{\"answers\":[4],\"advanced\":0}", "{\"answers\":[],\"advanced\":3}", "{\"answers\":[0,1,2],\"advanced\":0}"] {
    check(PolarChapterAttempt.restored(raw) == PolarChapterAttempt(), "Malformed checkpoints reset safely")
}
print("PASS: chapter interruption, first-answer scoring, restoration and completed checkpoint guards.")
