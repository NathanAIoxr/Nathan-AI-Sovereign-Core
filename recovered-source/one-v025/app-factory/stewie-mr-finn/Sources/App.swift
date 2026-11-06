import SwiftUI

@main
struct StewieAndMrFinnApp: App {
    @StateObject private var progress = MammalProgress()

    var body: some Scene {
        WindowGroup {
            GameHomeView()
                .environmentObject(progress)
                .preferredColorScheme(.light)
        }
    }
}

final class MammalProgress: ObservableObject {
    @Published private(set) var stars: Int
    @Published private(set) var accomplishments: Set<String>
    @Published private(set) var findings: Set<Int>
    @Published var chosenCat: String

    init() {
        let prefs = UserDefaults.standard
        stars = prefs.integer(forKey: "mammal.stars")
        accomplishments = Set(prefs.stringArray(forKey: "mammal.accomplishments") ?? [])
        findings = Set(prefs.array(forKey: "mammal.findings") as? [Int] ?? [])
        chosenCat = prefs.string(forKey: "mammal.cat") ?? "Stewart"
    }

    func choose(_ cat: String) {
        chosenCat = cat
        UserDefaults.standard.set(cat, forKey: "mammal.cat")
    }

    func win(_ key: String, reward: Int = 20) {
        guard !accomplishments.contains(key) else { return }
        accomplishments.insert(key)
        stars += reward
        save()
    }

    func find(_ index: Int) {
        guard !findings.contains(index) else { return }
        findings.insert(index)
        stars += 5
        if findings.count == 7 { win("explorer", reward: 20) }
        save()
    }

    private func save() {
        let prefs = UserDefaults.standard
        prefs.set(stars, forKey: "mammal.stars")
        prefs.set(Array(accomplishments), forKey: "mammal.accomplishments")
        prefs.set(Array(findings), forKey: "mammal.findings")
    }
}