import SwiftUI

/// Presentation preferences only. No new currency, access gate, or save migration.
struct MaterialWorldSettingsView: View {
    @AppStorage("material.worlds.facets.v1") private var facets = true
    @AppStorage("material.worlds.motion.v1") private var motion = true
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            Form {
                Section("Your look and feel") {
                    Toggle("Faceted shield pieces", isOn: $facets)
                    Toggle("Gameplay animation", isOn: $motion)
                    Text("The device’s Reduce Motion preference always takes priority.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
                Section("Free play") {
                    Text("No paid tokens, purchases, energy refills, or waiting to retry.")
                    Text("Stewart and Mr. Finn retain their own artwork, markings, story, and progress.")
                }
                Section("Optional modes") {
                    Text("Advanced boards, scheduled clubs, catalogue filters, and shared-device defense rehearsals are available in the compatible web builds. Remote multiplayer is not connected in this native source bundle.")
                        .font(.footnote)
                }
            }
            .navigationTitle("Display & play")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
    }
}

struct MaterialGemShape: Shape {
    var faceted: Bool
    func path(in rect: CGRect) -> Path {
        guard faceted else { return RoundedRectangle(cornerRadius: 8).path(in: rect) }
        let points: [CGPoint] = [CGPoint(x: 0.2,y: 0),CGPoint(x: 0.8,y: 0),CGPoint(x: 1,y: 0.25),CGPoint(x: 0.9,y: 0.75),CGPoint(x: 0.5,y: 1),CGPoint(x: 0.1,y: 0.75),CGPoint(x: 0,y: 0.25)]
        var path=Path()
        for (i,p) in points.enumerated() {
            let point=CGPoint(x:rect.minX+p.x*rect.width,y:rect.minY+p.y*rect.height)
            if i == 0 { path.move(to:point) } else { path.addLine(to:point) }
        }
        path.closeSubpath()
        return path
    }
}
