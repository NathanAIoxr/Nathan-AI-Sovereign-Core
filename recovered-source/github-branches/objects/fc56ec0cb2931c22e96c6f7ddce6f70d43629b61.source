import XCTest

/// Tests the rendered iPhone game by operating its real buttons and gestures.
/// This is simulator interaction, not a claim of human-device validation.
final class MatchThreeHumanUITests: XCTestCase {
    private func openBoard(_ style: String = "classic", reset: Bool = true) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = [
            "--qa-screen", "match3-board",
            "--qa-match3-style", style
        ] + (reset ? ["--qa-match3-reset"] : [])
        app.launch()
        XCTAssertTrue(app.buttons["match3.tile.0"].waitForExistence(timeout: 15), "First tile must load")
        XCTAssertTrue(app.staticTexts["match3.moves"].exists)
        XCTAssertTrue(app.staticTexts["match3.goal"].exists)
        XCTAssertTrue(app.staticTexts["match3.instructions"].exists)
        return app
    }

    private func moves(_ app: XCUIApplication) -> Int {
        guard let result = Int(app.staticTexts["match3.moves"].label) else {
            XCTFail("Can't read number of moves")
            return -1
        }
        return result
    }

    private func hintAndPlay(_ app: XCUIApplication, swipe: Bool) -> Bool {
        let hintButton = app.buttons["match3.hint"]
        guard hintButton.exists && hintButton.isEnabled else { return false }
        hintButton.tap()
        let message = app.staticTexts.matching(
            NSPredicate(format: "label BEGINSWITH %@", "Swap row ")
        ).firstMatch
        XCTAssertTrue(message.waitForExistence(timeout: 3), "The hint must name both cells")
        guard let pair = parseHint(message.label) else { return false }
        let start = app.buttons["match3.tile.\(pair.0)"]
        let end = app.buttons["match3.tile.\(pair.1)"]
        XCTAssertTrue(start.exists && end.exists)
        let priorMoves = moves(app)
        if swipe {
            start.press(forDuration: 0.1, thenDragTo: end)
        } else {
            // A hint preselects the source; finish the swap by tapping its neighbor.
            end.tap()
        }
        let changed = moves(app) == priorMoves - 1
        XCTAssertTrue(changed, "A legal gesture should use precisely one move")
        return changed
    }

    private func parseHint(_ label: String) -> (Int, Int)? {
        let pattern = #"Swap row (\d+), column (\d+) with row (\d+), column (\d+)"#
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: label, range: NSRange(label.startIndex..., in: label))
        else {
            XCTFail("Hint coordinates were not understandable: \(label)")
            return nil
        }
        let ns = label as NSString
        let values = (1...4).compactMap { Int(ns.substring(with: match.range(at: $0))) }
        guard values.count == 4 else { return nil }
        let a = (values[0] - 1) * 7 + values[1] - 1
        let b = (values[2] - 1) * 7 + values[3] - 1
        guard (0..<49).contains(a), (0..<49).contains(b),
              (abs(a-b) == 7 || (a/7 == b/7 && abs(a-b) == 1)) else {
            XCTFail("Hint proposed a nonadjacent swap")
            return nil
        }
        return (a,b)
    }

    func testGentleClassicChallengeMovesAndAccessibleTiles() {
        for style in ["gentle", "classic", "challenge"] {
            let app = openBoard(style)
            // Level one starts with 29 + (1 % 5) = 30. Keep this check derived
            // from that rule, plus each comfort-style adjustment.
            let baseline = 29 + (1 % 5)
            let bonus = style == "gentle" ? 14 : style == "classic" ? 0 : -7
            XCTAssertEqual(moves(app), baseline + bonus, "Moves for \(style)")
            XCTAssertEqual(app.buttons["match3.tile.0"].label.contains("Row 1, column 1"), true)
            XCTAssertTrue(app.buttons["match3.tile.48"].exists)
            XCTAssertTrue(app.buttons["match3.hint"].isEnabled)
            app.terminate()
        }
    }

    func testActualTapSwipeResumeAndRestart() {
        let app = openBoard()
        let openingMoves = moves(app)
        XCTAssertTrue(hintAndPlay(app, swipe: false))
        XCTAssertEqual(moves(app), openingMoves - 1)
        let savedMoves = moves(app)
        app.terminate()
        app.launchArguments = ["--qa-screen", "match3-board"]
        app.launch()
        XCTAssertTrue(app.buttons["match3.tile.0"].waitForExistence(timeout: 15))
        XCTAssertEqual(moves(app), savedMoves, "Continue must reload exact saved move count")
        XCTAssertTrue(hintAndPlay(app, swipe: true), "Swiping must work as a gesture")
        let restart = app.buttons["match3.restart"]
        XCTAssertTrue(restart.exists)
        restart.tap()
        XCTAssertEqual(moves(app), openingMoves, "Restart must reset moves")
        app.terminate()
    }

    func testLargeTextControlsCanPlayWithoutPreciseFingerSwipes() {
        let app = XCUIApplication()
        app.launchArguments = ["--qa-screen", "match3-board",
                               "--qa-large-text", "--qa-match3-reset",
                               "--qa-match3-style", "gentle"]
        app.launch()
        let tile = app.buttons["match3.tile.0"]
        XCTAssertTrue(tile.waitForExistence(timeout: 15))
        XCTAssertTrue(tile.isHittable, "The board must start visible at accessibility text sizes")
        for direction in ["left", "up", "down", "right"] {
            let button = app.buttons["match3.move.\(direction)"]
            XCTAssertTrue(button.exists, "Missing accessible \(direction) control")
        }
        let before = moves(app)
        app.buttons["match3.hint"].tap()
        let hint = app.staticTexts.matching(
            NSPredicate(format: "label BEGINSWITH %@", "Swap row ")
        ).firstMatch
        XCTAssertTrue(hint.waitForExistence(timeout: 5))
        if let (a, b) = parseHint(hint.label) {
            let direction = b == a+1 ? "right" : b == a-1 ? "left" : b == a+7 ? "down" : "up"
            app.buttons["match3.move.\(direction)"].tap()
            XCTAssertEqual(moves(app), before-1,
                           "Large-text arrow control should perform an actual match")
        }
        app.terminate()
    }

    func testPlayFullOpeningLevelWithHintsLikeAPlayer() {
        let app = openBoard("gentle")
        var wins = false
        for _ in 0..<3 {
            for _ in 0..<50 {
                if app.staticTexts.matching(
                    NSPredicate(format: "label BEGINSWITH %@", "Level 1 clear!")
                ).firstMatch.exists {
                    wins = true
                    break
                }
                if !app.buttons["match3.hint"].isEnabled { break }
                XCTAssertTrue(hintAndPlay(app, swipe: false))
            }
            if wins { break }
            if app.buttons["Try again"].exists {
                app.buttons["Try again"].tap()
            } else { break }
        }
        XCTAssertTrue(wins, "A supported Gentle run should be finishable through actual taps")
        if wins {
            let next = app.buttons.matching(
                NSPredicate(format: "label CONTAINS %@", "Next match-3 level")
            ).firstMatch
            XCTAssertTrue(next.exists)
        }
        app.terminate()
    }
}