// For a NEW iOS SwiftUI project only. If adding to an existing app,
// do not add a second @main type; instead present UniversalPhysicsArenaView().
import SwiftUI

@main
struct HybridKineticDemoApp: App {
    var body: some Scene {
        WindowGroup {
            UniversalPhysicsArenaView()
        }
    }
}
