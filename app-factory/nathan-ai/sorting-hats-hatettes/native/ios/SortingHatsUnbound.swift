import SwiftUI

struct Realm: Decodable {
    let name: String
    let copy: String
    let turns: [String]
    let reverse: Bool
}

struct BrimPair: Decodable {
    let id: String
    let hat: String
    let hatette: String
}

struct RealmCatalog: Decodable {
    let alphabet: String
    let headwear: [String]
    let materials: [String]
    let realms: [Realm]
    let winter: BrimPair
    let catalogSize: Int

    static func load() -> Self? {
        guard let file = Bundle.main.url(forResource: "realms", withExtension: "json"),
              let bytes = try? Data(contentsOf: file) else { return nil }
        return try? JSONDecoder().decode(Self.self, from: bytes)
    }

    func pair(_ realm: Int, _ letter: Int, _ material: Int, winter isWinter: Bool) -> BrimPair {
        if isWinter { return winter }
        let name = materials[material] + " " + headwear[letter]
        return BrimPair(id: "\(realm).\(letter).\(material)", hat: name, hatette: name + " Hatette")
    }
}

@main struct UnboundApp: App {
    var body: some Scene {
        WindowGroup {
            if let catalog = RealmCatalog.load(), !catalog.realms.isEmpty {
                RealmScreen(catalog: catalog)
            } else {
                Text("The realm catalog could not be loaded.")
            }
        }
    }
}

struct RealmScreen: View {
    let catalog: RealmCatalog
    @AppStorage("unbound.claims") private var storedClaims = ""
    @AppStorage("unbound.gates") private var storedGates = ""
    @AppStorage("unbound.realm") private var selectedRealm = 1
    @State private var letter = 0
    @State private var material = 0
    @State private var reversed = false
    @State private var winter = false
    @State private var turns: [String] = []
    @State private var status = ""

    private var realmIndex: Int { catalog.realms.indices.contains(selectedRealm) ? selectedRealm : 0 }
    private var realm: Realm { catalog.realms[realmIndex] }
    private var pair: BrimPair { catalog.pair(realmIndex, letter, material, winter: winter) }
    private var claims: Set<String> { Set(storedClaims.split(separator: ",").map(String.init)) }
    private var gates: Set<String> { Set(storedGates.split(separator: ",").map(String.init)) }
    private var letterOrder: [Int] {
        let indices = Array(catalog.alphabet.enumerated().map(\.offset))
        return reversed ? Array(indices.reversed()) : indices
    }

    private func turn(_ symbol: String) {
        turns = Array((turns + [symbol]).suffix(2))
        status = ""
    }

    private func claim() {
        storedClaims = claims.union([pair.id]).sorted().joined(separator: ",")
        status = "Pair claimed."
    }

    private func open() {
        guard reversed == realm.reverse, turns == realm.turns,
              claims.contains(where: { $0.hasPrefix("\(realmIndex).") }) else {
            status = "The gate is locked. Match the clue and claim a realm pair."
            return
        }
        let next = gates.union([String(realmIndex)])
        storedGates = next.sorted().joined(separator: ",")
        status = next.count == catalog.realms.count
            ? "All six gates cleared. DONE."
            : "Gate open. The forced labels are cleared in \(realm.name)."
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Realm map") {
                    Picker("Realm", selection: $selectedRealm) {
                        ForEach(catalog.realms.indices, id: \.self) { index in
                            let cleared = gates.contains(String(index))
                            Text(catalog.realms[index].name + (cleared ? " ✓" : "")).tag(index)
                        }
                    }
                    .onChange(of: selectedRealm) { _ in turns = []; status = "" }
                    Text(realm.copy)
                    Text("\(claims.count) pairs claimed · \(gates.count) of \(catalog.realms.count) gates opened")
                        .foregroundStyle(.secondary)
                }
                Section("Choose your own hat") {
                    Toggle("Z to A", isOn: $reversed)
                    Picker("Letter", selection: $letter) {
                        ForEach(letterOrder, id: \.self) { index in
                            Text(String(Array(catalog.alphabet)[index])).tag(index)
                        }
                    }
                    Picker("Material", selection: $material) {
                        ForEach(catalog.materials.indices, id: \.self) { index in
                            Text(catalog.materials[index]).tag(index)
                        }
                    }
                    Toggle("Santa’s cap & Solstice Crown", isOn: $winter)
                    Text(pair.hat + " ↔ " + pair.hatette)
                    Button(claims.contains(pair.id) ? "Pair claimed" : "Claim pair", action: claim)
                        .disabled(claims.contains(pair.id))
                }
                Section("Open the gate") {
                    Text("Set \(realm.reverse ? "Z to A" : "A to Z"), then tune \(realm.turns.joined(separator: " → ")).")
                    HStack {
                        Button("π Pi") { turn("π") }.buttonStyle(.bordered)
                        Button("φ Phi") { turn("φ") }.buttonStyle(.bordered)
                    }
                    Text(turns.isEmpty ? "Dial ready" : turns.joined(separator: " → "))
                    Button("Try the gate", action: open).buttonStyle(.borderedProminent)
                    if !status.isEmpty { Text(status).accessibilityIdentifier("gate-status") }
                }
            }
            .navigationTitle("Hatettes UNBOUND")
        }
    }
}
