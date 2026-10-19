import Foundation

@main
struct GamePaceTests {
    static func main() {
        let calm = GamePace.calm
        let steady = GamePace.steady
        let quick = GamePace.quick

        precondition(GamePace.allCases.count == 3)
        precondition(GamePace.restored("calm") == calm)
        precondition(GamePace.restored("steady") == steady)
        precondition(GamePace.restored("quick") == quick)
        precondition(GamePace.restored("unknown") == steady)
        precondition(calm.mismatchRevealSeconds > steady.mismatchRevealSeconds)
        precondition(steady.mismatchRevealSeconds > quick.mismatchRevealSeconds)
        precondition(quick.mismatchRevealSeconds >= 0.5)
        precondition(calm.animationSeconds > steady.animationSeconds)
        precondition(steady.animationSeconds > quick.animationSeconds)
        precondition(quick.animationSeconds > 0)
        print("GamePace timing, fallback, and ordering tests passed.")
    }
}
