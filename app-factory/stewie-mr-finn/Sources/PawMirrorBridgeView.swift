import SwiftUI
import WebKit

/// Original PAWS ⇄ SWAP game branch for Stewart and Mr. Finn.
/// The HTML, scripts, and drawings are packaged with the iPhone app.
struct PawMirrorBridgeView: View {
    var body: some View {
        PawMirrorBridgeWebView()
            .navigationTitle("Stewart & Finn · Mirror Bridge")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.white, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .background(Color(red: 0.03, green: 0.10, blue: 0.17))
    }
}

private struct PawMirrorBridgeWebView: UIViewRepresentable {
    func makeCoordinator() -> OfflineGameQAObserver { OfflineGameQAObserver() }
    func makeUIView(context: Context) -> WKWebView {
        let settings = WKWebViewConfiguration()
        settings.defaultWebpagePreferences.allowsContentJavaScript = true
        let view = WKWebView(frame: .zero, configuration: settings)
        view.navigationDelegate = context.coordinator
        view.isOpaque = false
        view.backgroundColor = UIColor(red: 0.03, green: 0.10, blue: 0.17, alpha: 1)
        view.scrollView.contentInsetAdjustmentBehavior = .never

        if let page = Bundle.main.url(
            forResource: "index",
            withExtension: "html",
            subdirectory: "PolarMiddleC/mirror-bridge"
        ) {
            view.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent().deletingLastPathComponent())
        } else {
            view.loadHTMLString(
                "<html><body style='font:18px system-ui;padding:24px'>Mirror Bridge files were not bundled with this build.</body></html>",
                baseURL: nil
            )
        }
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
