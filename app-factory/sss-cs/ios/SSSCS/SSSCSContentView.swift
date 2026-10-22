import SwiftUI
import WebKit
import UniformTypeIdentifiers

struct SSSCSContentView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default() // Persistent, on-device IndexedDB and encrypted content
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.allowsInlineMediaPlayback = true
        let controller = WKUserContentController()
        controller.add(context.coordinator, name: "sssNative")
        let nativeFlag = WKUserScript(source: "window.SSS_IOS_APP = true;", injectionTime: .atDocumentStart, forMainFrameOnly: true)
        controller.addUserScript(nativeFlag)
        config.userContentController = controller
        let view = WKWebView(frame: .zero, configuration: config)
        view.isOpaque = false
        view.backgroundColor = UIColor(red: 0.04, green: 0.08, blue: 0.12, alpha: 1)
        view.scrollView.contentInsetAdjustmentBehavior = .never
        view.navigationDelegate = context.coordinator
        view.uiDelegate = context.coordinator
        context.coordinator.view = view
        if let bundleResources = Bundle.main.resourceURL {
            let root = bundleResources.appendingPathComponent("Web", isDirectory: true)
            let start = root.appendingPathComponent("index.html", isDirectory: false)
            if FileManager.default.fileExists(atPath: start.path) {
                context.coordinator.allowedDirectory = root.standardizedFileURL.path + "/"
                view.loadFileURL(start, allowingReadAccessTo: root)
            } else {
                view.loadHTMLString("<h1>SSS-CS files unavailable</h1><p>Rebuild with the Web directory included in the app bundle.</p>", baseURL: nil)
            }
        } else {
            view.loadHTMLString("<h1>SSS-CS files unavailable</h1><p>Rebuild with the Web directory included in the app bundle.</p>", baseURL: nil)
        }
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) { }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        weak var view: WKWebView?
        var allowedDirectory: String = ""

        // Only bundled local code is permitted. No remote advertisements, tracking, or navigation.
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url, url.isFileURL,
                  url.standardizedFileURL.path.hasPrefix(allowedDirectory) else {
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        func userContentController(_ userContentController: WKUserContentController,
                                   didReceive message: WKScriptMessage) {
            guard message.name == "sssNative",
                  let body = message.body as? [String: Any],
                  body["type"] as? String == "export",
                  let text = body["base64"] as? String,
                  text.count <= 34_000_000,
                  let binary = Data(base64Encoded: text),
                  binary.count <= 25 * 1024 * 1024,
                  let original = body["filename"] as? String else { return }

            let permitted = CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.")
            let cleanName = String(original.unicodeScalars.map { permitted.contains($0) ? Character($0) : "_" })
            guard !cleanName.isEmpty, cleanName != ".", cleanName != ".." else { return }
            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent(UUID().uuidString + "-" + cleanName, isDirectory: false)
            do {
                try binary.write(to: url, options: .atomic)
                DispatchQueue.main.async {
                    guard let presenter = self.view?.window?.rootViewController else { return }
                    let picker = UIDocumentPickerViewController(forExporting: [url], asCopy: true)
                    picker.modalPresentationStyle = .formSheet
                    presenter.present(picker, animated: true)
                }
            } catch {
                NSLog("SSS-CS: Native export failed: \(error.localizedDescription)")
            }
        }

        // Always prompt for microphone permission when the user explicitly starts a recording.
        @available(iOS 15.0, *)
        func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                     initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType,
                     decisionHandler: @escaping (WKPermissionDecision) -> Void) {
            decisionHandler(.prompt)
        }
    }
}
