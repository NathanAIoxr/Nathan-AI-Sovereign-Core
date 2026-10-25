import WebKit

/// Simulator QA verifies a rendered puzzle rather than photographing a cold WebKit surface.
/// Release builds never write QA markers or evaluate this diagnostic script.
final class OfflineGameQAObserver: NSObject, WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        #if DEBUG
        guard ProcessInfo.processInfo.arguments.contains("--qa-screen") else { return }
        webView.evaluateJavaScript("document.querySelectorAll('#choices button').length") { result, error in
            let count = (result as? NSNumber)?.intValue ?? 0
            Self.record(error == nil && count > 0 ? "ready" : "error: puzzle choices did not render")
        }
        #endif
    }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        #if DEBUG
        Self.record("error: navigation failed")
        #endif
    }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        #if DEBUG
        Self.record("error: page could not load")
        #endif
    }
    #if DEBUG
    private static func record(_ text: String) {
        guard ProcessInfo.processInfo.arguments.contains("--qa-screen") else { return }
        let url = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("qa-web-ready.txt")
        try? text.write(to: url, atomically: true, encoding: .utf8)
    }
    #endif
}
