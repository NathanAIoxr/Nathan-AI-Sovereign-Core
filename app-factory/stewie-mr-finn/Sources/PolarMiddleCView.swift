import SwiftUI
import WebKit

/// Offline polar-family branch of The Adventures of Stewart & Mr. Finn.
/// Bundled HTML, JavaScript and reference data use no network requests.
struct PolarMiddleCView: View {
    var body: some View {
        PolarMiddleCWebView()
            .navigationTitle("HO ↔ OH · Middle C")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.white, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .background(Color(red: 0.02, green: 0.08, blue: 0.16))
    }
}

private struct PolarMiddleCWebView: UIViewRepresentable {
    func makeCoordinator() -> OfflineGameQAObserver { OfflineGameQAObserver() }
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        let view = WKWebView(frame: .zero, configuration: config)
        view.navigationDelegate = context.coordinator
        view.isOpaque = false
        view.backgroundColor = UIColor(red: 0.02, green: 0.08, blue: 0.16, alpha: 1)
        view.scrollView.contentInsetAdjustmentBehavior = .never

        if let url = Bundle.main.url(
            forResource: "index",
            withExtension: "html",
            subdirectory: "PolarMiddleC"
        ) {
            view.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        } else {
            view.loadHTMLString(
                "<html><body style='font:18px system-ui;padding:24px'>Polar Middle C files are not bundled in this build.</body></html>",
                baseURL: nil
            )
        }
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
