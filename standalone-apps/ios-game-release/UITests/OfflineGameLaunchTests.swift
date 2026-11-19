import XCTest

final class OfflineGameLaunchTests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testBundledGameplayOpens() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.navigationBars.firstMatch.waitForExistence(timeout: 12))
        if app.buttons["Route editor"].exists {
            launch("Route editor", in: app)
            assertButton("Build draft", in: app)
            app.webViews.buttons["Build draft"].tap()
            assertButton("Apply to playback", in: app)
        } else if app.buttons["Yard Darts"].exists {
            launch("Yard Darts", in: app)
            assertButton("SOLO ARCADE", in: app)
            app.webViews.buttons["SOLO ARCADE"].tap()
            XCTAssertTrue(app.webViews.staticTexts["ROUND 1 / 5"].waitForExistence(timeout: 12))
            app.buttons["Library"].tap()
            launch("Hook & Ring", in: app)
            XCTAssertTrue(app.webViews.staticTexts["Ready to swing"].waitForExistence(timeout: 12))
            app.buttons["Library"].tap()
            launch("Swordplay Practice", in: app)
            XCTAssertTrue(app.webViews.staticTexts["Swordplay Practice"].waitForExistence(timeout: 12))
            app.buttons["Library"].tap()
            launch("Spear Phalanx Target", in: app)
            XCTAssertTrue(app.webViews.staticTexts["Spear Phalanx Target"].waitForExistence(timeout: 12))
        } else if app.buttons["Sudoku Master"].exists {
            launch("Sudoku Master", in: app)
            assertButton("New puzzle", in: app)
            XCTAssertTrue(app.webViews.buttons["Hint"].exists)
            let firstSquare = app.webViews.buttons.matching(
                NSPredicate(format: "label BEGINSWITH %@", "Row 1, column 1")
            ).firstMatch
            XCTAssertTrue(firstSquare.waitForExistence(timeout: 12))
        } else {
            launch("Zero & Void Lab", in: app)
            assertButton("One tick", in: app)
            app.webViews.buttons["One tick"].tap()
            app.buttons["Library"].tap()
            launch("Category Challenge", in: app)
            assertButton("Numbers", in: app)
            app.webViews.buttons["Numbers"].tap()
            assertButton("9 + 15", in: app)
        }
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Bundled gameplay after native launch"
        screenshot.lifetime = .keepAlways
        add(screenshot)
    }

    private func launch(_ title: String, in app: XCUIApplication) {
        let button = app.buttons[title].firstMatch
        if !button.isHittable {
            let search = app.searchFields.firstMatch
            if search.exists {
                search.tap()
                if let current = search.value as? String, !current.isEmpty, current != "Find an activity" {
                    search.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: current.count))
                }
                search.typeText(title)
            }
        }
        XCTAssertTrue(button.waitForExistence(timeout: 8), title)
        button.tap()
    }

    private func assertButton(_ title: String, in app: XCUIApplication) {
        XCTAssertTrue(app.webViews.buttons[title].firstMatch.waitForExistence(timeout: 12), title)
    }
}
