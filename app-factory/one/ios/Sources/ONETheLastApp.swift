import SwiftUI
import WebKit
import UIKit

// ONE — THE LAST APP · Native iPhone test host.
// Original source stays in existing ONE / Sealed Voice Box web application.
// This first IPA is a network-dependent, user-controlled shell; no server
// credentials, private files or app tracking are built into the binary.
@MainActor
final class ONEBrowser: ObservableObject {
    static let base = URL(string: "https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/one/")!

    enum Destination: String {
        case home = "index.html"
        case voice = "offloader/index.html"
        case library = "library/index.html"
    }

    weak var webView: WKWebView?
    @Published var errorMessage: String?
    @Published var isLoading = false
    @Published var canGoBack = false

    func open(_ destination: Destination) {
        errorMessage = nil
        webView?.load(URLRequest(url: Self.base.appendingPathComponent(destination.rawValue),
                                cachePolicy: .useProtocolCachePolicy))
    }

    func refresh() {
        errorMessage = nil
        webView?.reload()
    }

    func back() { webView?.goBack() }

    func updateState(_ webView: WKWebView) {
        isLoading = webView.isLoading
        canGoBack = webView.canGoBack
    }
}

struct ONEWebView: UIViewRepresentable {
    @ObservedObject var browser: ONEBrowser

    func makeCoordinator() -> Coordinator { Coordinator(browser: browser) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = [.audio, .video]

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.04, green: 0.10, blue: 0.11, alpha: 1)
        webView.scrollView.backgroundColor = webView.backgroundColor
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        browser.webView = webView
        webView.load(URLRequest(url: ONEBrowser.base.appendingPathComponent(ONEBrowser.Destination.home.rawValue)))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate {
        let browser: ONEBrowser
        private var downloadPaths: [ObjectIdentifier: URL] = [:]

        init(browser: ONEBrowser) { self.browser = browser }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            browser.errorMessage = nil
            browser.updateState(webView)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            browser.errorMessage = nil
            browser.updateState(webView)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            browser.errorMessage = "Cannot reach ONE right now. Connect to the internet and tap Retry. Your previously saved local data is not intentionally removed."
            browser.updateState(webView)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            browser.updateState(webView)
        }

        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if action.shouldPerformDownload {
                decisionHandler(.download)
                return
            }
            if let url = action.request.url,
               ["https", "http"].contains(url.scheme?.lowercased() ?? ""),
               url.host?.lowercased() != "nathanaioxr.github.io" {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, decidePolicyFor response: WKNavigationResponse,
                     decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
            decisionHandler(response.canShowMIMEType ? .allow : .download)
        }

        func webView(_ webView: WKWebView, navigationAction: WKNavigationAction,
                     didBecome download: WKDownload) {
            download.delegate = self
        }

        func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse,
                     didBecome download: WKDownload) {
            download.delegate = self
        }

        func download(_ download: WKDownload, decideDestinationUsing response: URLResponse,
                      suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
            let filename = URL(fileURLWithPath: suggestedFilename).lastPathComponent
            let path = FileManager.default.temporaryDirectory
                .appendingPathComponent(UUID().uuidString + "-" + filename)
            downloadPaths[ObjectIdentifier(download)] = path
            completionHandler(path)
        }

        func downloadDidFinish(_ download: WKDownload) {
            guard let file = downloadPaths.removeValue(forKey: ObjectIdentifier(download)) else { return }
            DispatchQueue.main.async {
                guard let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first,
                      let window = scene.windows.first(where: { $0.isKeyWindow }),
                      var presenter = window.rootViewController else { return }
                while let next = presenter.presentedViewController { presenter = next }
                let sheet = UIActivityViewController(activityItems: [file], applicationActivities: nil)
                if let popover = sheet.popoverPresentationController {
                    popover.sourceView = presenter.view
                    popover.sourceRect = presenter.view.bounds
                }
                presenter.present(sheet, animated: true)
            }
        }

        func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
            downloadPaths.removeValue(forKey: ObjectIdentifier(download))
            browser.errorMessage = "File download failed. Your original is still in the vault; retry downloading the encrypted backup."
        }

        func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String,
                     defaultText: String?, initiatedByFrame frame: WKFrameInfo,
                     completionHandler: @escaping (String?) -> Void) {
            guard let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first,
                  let window = scene.windows.first(where: { $0.isKeyWindow }),
                  var presenter = window.rootViewController else {
                completionHandler(nil)
                return
            }
            while let next = presenter.presentedViewController { presenter = next }
            let alert = UIAlertController(title: "ONE — Confirm", message: prompt, preferredStyle: .alert)
            alert.addTextField { field in
                field.text = defaultText
                field.autocorrectionType = .no
            }
            alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(nil) })
            alert.addAction(UIAlertAction(title: "Confirm", style: .default) { _ in
                completionHandler(alert.textFields?.first?.text)
            })
            presenter.present(alert, animated: true)
        }

        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            guard let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first,
                  let window = scene.windows.first(where: { $0.isKeyWindow }),
                  var presenter = window.rootViewController else {
                completionHandler()
                return
            }
            while let next = presenter.presentedViewController { presenter = next }
            let alert = UIAlertController(title: "ONE", message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
            presenter.present(alert, animated: true)
        }

        @available(iOS 15.0, *)
        func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                     initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType,
                     decisionHandler: @escaping (WKPermissionDecision) -> Void) {
            decisionHandler(.prompt) // The user always approves voice capture.
        }
    }
}

@main
struct ONETheLastApp: App {
    @StateObject private var browser = ONEBrowser()

    var body: some Scene {
        WindowGroup {
            VStack(spacing: 0) {
                HStack(spacing: 12) {
                    Image(systemName: "circle.hexagongrid.fill")
                        .font(.system(size: 23, weight: .bold))
                        .foregroundColor(Color(red: 0.93, green: 0.79, blue: 0.51))
                    VStack(alignment: .leading, spacing: 2) {
                        Text("ONE · THE LAST APP")
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                        Text("YULL LAW · YALL LAW · SEALED VOICE BOX")
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundColor(.mint)
                    }
                    Spacer(minLength: 0)
                    if browser.isLoading { ProgressView().tint(.mint) }
                }
                .padding(.horizontal, 15)
                .padding(.vertical, 11)
                .background(Color(red: 0.07, green: 0.15, blue: 0.17))

                ZStack {
                    // Keep the original WKWebView mounted: a failed request must not
                    // destroy its local IndexedDB vault or disable the Retry button.
                    ONEWebView(browser: browser)
                    if let message = browser.errorMessage {
                        VStack(spacing: 14) {
                            Image(systemName: "wifi.exclamationmark")
                                .font(.system(size: 34))
                                .foregroundStyle(.orange)
                            Text(message).multilineTextAlignment(.center).padding(.horizontal)
                            Button("Retry") { browser.refresh() }
                                .buttonStyle(.borderedProminent)
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color(red: 0.04, green: 0.10, blue: 0.11))
                    }
                }

                HStack(spacing: 7) {
                    navButton("ONE", icon: "house.fill") { browser.open(.home) }
                    navButton("VOICE BOX", icon: "lock.shield.fill") { browser.open(.voice) }
                    navButton("LIBRARY", icon: "books.vertical.fill") { browser.open(.library) }
                    navButton("BACK", icon: "chevron.left") { browser.back() }
                        .disabled(!browser.canGoBack)
                    navButton("RETRY", icon: "arrow.clockwise") { browser.refresh() }
                }
                .padding(.horizontal, 5)
                .padding(.vertical, 10)
                .background(Color(red: 0.07, green: 0.15, blue: 0.17))
            }
            .foregroundColor(.white)
            .background(Color(red: 0.04, green: 0.10, blue: 0.11))
        }
    }

    private func navButton(_ title: String, icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon).font(.system(size: 16))
                Text(title).font(.system(size: 9, weight: .semibold))
            }
            .frame(maxWidth: .infinity)
            .foregroundStyle(Color(red: 0.79, green: 0.94, blue: 0.85))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
    }
}
