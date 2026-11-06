import SwiftUI

@main
struct StewieAndMrFinnApp: App {
    @StateObject private var progress = MammalProgress()

    init() {
        #if DEBUG
        // Only the simulator test harness may start with a fresh match-3 save.
        // No player save is reset or migrated by production builds.
        let args = ProcessInfo.processInfo.arguments
        if args.contains("--qa-match3-reset") {
            UserDefaults.standard.removeObject(forKey: "mammal.match3.v1")
        }
        if let index = args.firstIndex(of: "--qa-match3-style"), args.count > index + 1 {
            UserDefaults.standard.set(args[index + 1], forKey: "mammal.match3.comfort.v1")
        }
        #endif
    }

    var body: some Scene {
        WindowGroup {
            launchView
                .environmentObject(progress)
                .preferredColorScheme(.light)
        }
    }
    @ViewBuilder private var launchView: some View {
        #if DEBUG
        if let index = ProcessInfo.processInfo.arguments.firstIndex(of: "--qa-screen"),
           ProcessInfo.processInfo.arguments.count > index + 1 {
            Group {
                if ProcessInfo.processInfo.arguments[index + 1] == "home" { GameHomeView() }
                else { NavigationStack { qaScreen(ProcessInfo.processInfo.arguments[index + 1]) } }
            }
            .dynamicTypeSize(ProcessInfo.processInfo.arguments.contains("--qa-large-text") ? .accessibility3 : .large)
        } else { GameHomeView() }
        #else
        GameHomeView()
        #endif
    }
    #if DEBUG
    @ViewBuilder private func qaScreen(_ name: String) -> some View {
        switch name {
        case "quick-games": ActivityShelfView(shelf: .games)
        case "story-shelf": ActivityShelfView(shelf: .stories)
        case "create-shelf": ActivityShelfView(shelf: .create)
        case "word-shelf": ActivityShelfView(shelf: .words)
        case "map": CampaignMapView()
        case "unified": UnifiedAdventureView()
        case "match3": MatchThreeAdventureView()
        case "match3-board": MatchThreeLevelView(level: 1)
        case "board": QuestBoardView(levelID: 1)
        case "polar": PolarFamilyQuestView()
        case "chapter1": PolarChapterPlayView(chapter: PolarFamilyCatalog.chapter(1)!) { _, _ in }
        case "workshop": PolarChapterPlayView(chapter: PolarFamilyCatalog.chapter(9)!) { _, _ in }
        case "reunion": PolarChapterPlayView(chapter: PolarFamilyCatalog.chapter(16)!) { _, _ in }
        case "lab": MammalChallengeLabView()
        case "playroom": MammalPlayroomView()
        case "stories": MammalStoryMomentsView()
        case "explore": ExploreView()
        case "puzzle": PuzzleView()
        case "biscuits": BiscuitView()
        case "trust": TrustQuizView()
        case "champ": ChampSnackView()
        case "ace": AceDanceView()
        case "middlec": PolarMiddleCView()
        case "mirror": PawMirrorBridgeView()
        case "family": FamilyView()
        case "settings": MammalFamilyGuideView()
        default: GameHomeView()
        }
    }
    #endif

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