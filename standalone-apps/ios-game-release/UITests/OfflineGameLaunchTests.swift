import XCTest

final class OfflineGameLaunchTests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testBundledGameplayOpens() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.navigationBars.firstMatch.waitForExistence(timeout: 12))
        if app.buttons["Route editor"].exists {
            launch("Route editor", in: app)
            let editorLink = app.webViews.links["Route editor"].firstMatch
            require(editorLink, named: "Route editor link", in: app)
            editorLink.tap()
            tapWebButton("Build draft", in: app)
            tapWebButton("Apply to playback", in: app)
            require(app.webViews.staticTexts["Draft applied to playback."].firstMatch,
                    named: "Applied route confirmation", in: app)
        } else if app.buttons["Yard Darts"].exists {
            launch("Yard Darts", in: app)
            let soloMode = app.webViews.switches["SOLO ARCADE"].firstMatch
            require(soloMode, named: "Solo Arcade mode", in: app)
            soloMode.tap()
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
            tapWebButton("New puzzle", in: app)
            require(app.webViews.buttons["Hint"].firstMatch, named: "Hint", in: app)
            let firstSquare = app.webViews.switches.matching(
                NSPredicate(format: "label BEGINSWITH %@", "Row 1, column 1")
            ).firstMatch
            require(firstSquare, named: "First Sudoku square", in: app)
        } else {
            launch("Zero & Void Lab", in: app)
            tapWebButton("One tick", in: app)
            app.buttons["Library"].tap()
            launch("Category Challenge", in: app)
            tapWebButton("Numbers", in: app)
            require(app.webViews.buttons["9 + 15"].firstMatch, named: "9 + 15", in: app)
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

    private func tapWebButton(_ title: String, in app: XCUIApplication) {
        let button = app.webViews.buttons[title].firstMatch
        require(button, named: title, in: app)
        let viewport = app.webViews.firstMatch
        for _ in 0..<3 {
            if viewport.frame.contains(CGPoint(x: button.frame.midX, y: button.frame.midY)) { break }
            let start = viewport.coordinate(withNormalizedOffset: CGVector(dx: 0.98, dy: 0.78))
            let end = viewport.coordinate(withNormalizedOffset: CGVector(dx: 0.98, dy: 0.25))
            start.press(forDuration: 0.05, thenDragTo: end)
        }
        XCTAssertTrue(viewport.frame.contains(CGPoint(x: button.frame.midX, y: button.frame.midY)), title)
        button.tap()
    }

    private func require(_ element: XCUIElement, named title: String, in app: XCUIApplication) {
        if element.waitForExistence(timeout: 20) { return }
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Missing gameplay control - \(title)"
        screenshot.lifetime = .keepAlways
        add(screenshot)
        print(app.debugDescription)
        XCTFail("Missing gameplay control: \(title)")
    }
}
