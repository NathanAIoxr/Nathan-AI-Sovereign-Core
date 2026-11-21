import SwiftUI
import UIKit
import WebKit

private let bundledOrigin = URL(string: "tabor-local://app")!

struct GameEntry: Decodable, Identifiable, Equatable {
    let id: String
    let title: String
    let group: String
    let path: String
}

struct BundledAsset: Decodable {
    let file: String
    let type: String
}

struct GameShelf: Decodable {
    let title: String
    let entries: [GameEntry]
    let routes: [String: BundledAsset]

    static let bundled: GameShelf? = {
        guard let url = Bundle.main.url(forResource: "shelf", withExtension: "json"),
              let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(Self.self, from: data)
    }()
}

@main
struct TaborGameApp: App {
    var body: some Scene {
        WindowGroup {
            if let shelf = GameShelf.bundled {
                GameLibrary(shelf: shelf)
            } else {
                ContentUnavailableView("Games unavailable", systemImage: "exclamationmark.triangle",
                                       description: Text("The installed app bundle is missing its game files."))
            }
        }
    }
}

struct GameLibrary: View {
    let shelf: GameShelf
    @AppStorage("lastGameID") private var lastGameID = ""
    @State private var selected: GameEntry?
    @State private var query = ""
    @State private var showingPrivacy = false
    @State private var export: LocalExport?
    @State private var failure = false
    @State private var refresh = UUID()

    private var filtered: [GameEntry] {
        guard !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return shelf.entries }
        return shelf.entries.filter { $0.title.localizedCaseInsensitiveContains(query) }
    }

    var body: some View {
        NavigationStack {
            Group {
                if let entry = selected {
                    game(entry)
                } else {
                    library
                }
            }
            .navigationTitle(selected?.title ?? shelf.title)
            .navigationBarTitleDisplayMode(selected == nil ? .large : .inline)
            .toolbar {
                if selected != nil {
                    ToolbarItem(placement: .topBarLeading) {
                        Button("Library", systemImage: "square.grid.2x2") { selected = nil; failure = false }
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Privacy", systemImage: "hand.raised") { showingPrivacy = true }
                        .labelStyle(.iconOnly)
                }
            }
            .sheet(isPresented: $showingPrivacy) {
                NavigationStack {
                    List {
                        Text("Game files run on this device. The iPhone build has no account, ads, analytics, or location permission.")
                        Text("Game progress and the last selection can be stored on this device. Sharing an export uses the iOS share sheet after you choose a destination.")
                    }
                    .navigationTitle("Privacy")
                    .toolbar { Button("Done") { showingPrivacy = false } }
                }
            }
            .sheet(item: $export, onDismiss: { export = nil }) { document in
                ExportSheet(file: document.url)
                    .onDisappear { try? FileManager.default.removeItem(at: document.url.deletingLastPathComponent()) }
            }
        }
    }

    private var library: some View {
        List {
            if query.isEmpty, let entry = shelf.entries.first(where: { $0.id == lastGameID }) {
                Section("Continue") { button(for: entry) }
            }
            ForEach(Array(Set(filtered.map(\.group))).sorted(by: groupOrder), id: \.self) { group in
                Section(group) {
                    ForEach(filtered.filter { $0.group == group }) { entry in button(for: entry) }
                }
            }
        }
        .searchable(text: $query, prompt: "Find an activity")
        .overlay {
            if filtered.isEmpty { ContentUnavailableView.search(text: query) }
        }
    }

    private func groupOrder(_ first: String, _ second: String) -> Bool {
        if first == "Featured" { return second != "Featured" }
        if second == "Featured" { return false }
        return first < second
    }

    private func button(for entry: GameEntry) -> some View {
        Button {
            UISelectionFeedbackGenerator().selectionChanged()
            lastGameID = entry.id
            failure = false
            selected = entry
        } label: {
            Label(entry.title, systemImage: "play.circle")
        }
    }

    private func game(_ entry: GameEntry) -> some View {
        ZStack {
            LocalGameView(shelf: shelf, path: entry.path, failure: $failure, export: $export)
                .id(refresh)
                .accessibilityHidden(failure)
            if failure {
                ContentUnavailableView {
                    Label("Game could not open", systemImage: "exclamationmark.triangle")
                } actions: {
                    Button("Reload game") { failure = false; refresh = UUID() }
                }
                .background(.background)
            }
        }
    }
}

struct LocalExport: Identifiable {
    let id = UUID()
    let url: URL
}

struct ExportSheet: UIViewControllerRepresentable {
    let file: URL
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: [file], applicationActivities: nil)
    }
    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}

@MainActor
final class GameAssetHandler: NSObject, WKURLSchemeHandler {
    let routes: [String: BundledAsset]

    init(routes: [String: BundledAsset]) { self.routes = routes }

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url, url.scheme == bundledOrigin.scheme, url.host == bundledOrigin.host,
              ["GET", "HEAD"].contains(task.request.httpMethod ?? "GET"),
              let asset = routes[url.path.isEmpty ? "/" : url.path],
              let base = Bundle.main.resourceURL else {
            task.didFailWithError(URLError(.fileDoesNotExist))
            return
        }
        let file = base.appendingPathComponent((asset.file as NSString).lastPathComponent)
        guard let data = try? Data(contentsOf: file),
              let response = HTTPURLResponse(
                url: url, statusCode: 200, httpVersion: "HTTP/1.1",
                headerFields: [
                    "Content-Type": asset.type.hasPrefix("image/") ? asset.type : asset.type + "; charset=utf-8",
                    "Content-Length": String(data.count),
                    "Access-Control-Allow-Origin": "*",
                    "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
                    "Content-Security-Policy": "default-src 'none'; script-src 'self' tabor-local:; style-src 'self' 'unsafe-inline' tabor-local:; img-src 'self' data: tabor-local:; connect-src 'self' tabor-local:; base-uri 'none'; form-action 'none'"
                ]) else {
            task.didFailWithError(URLError(.fileDoesNotExist))
            return
        }

        task.didReceive(response)
        if task.request.httpMethod != "HEAD" { task.didReceive(data) }
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}

struct LocalGameView: UIViewRepresentable {
    let shelf: GameShelf
    let path: String
    @Binding var failure: Bool
    @Binding var export: LocalExport?

    func makeCoordinator() -> Coordinator { Coordinator(owner: self) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(GameAssetHandler(routes: shelf.routes), forURLScheme: "tabor-local")
        config.dataDetectorTypes = []
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        if let url = URL(string: path, relativeTo: bundledOrigin) {
            webView.load(URLRequest(url: url.absoluteURL))
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        context.coordinator.owner = self
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate {
        var owner: LocalGameView
        private var files: [ObjectIdentifier: URL] = [:]

        init(owner: LocalGameView) { self.owner = owner }

        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { decisionHandler(.cancel); return }
            if action.shouldPerformDownload, url.scheme == "blob" {
                decisionHandler(.download)
            } else if url.scheme == bundledOrigin.scheme, url.host == bundledOrigin.host,
                      owner.shelf.routes[url.path.isEmpty ? "/" : url.path] != nil {
                decisionHandler(action.shouldPerformDownload ? .download : .allow)
            } else {
                decisionHandler(.cancel)
            }
        }

        func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
            download.delegate = self
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            showNavigationFailure(error)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            showNavigationFailure(error)
        }

        private func showNavigationFailure(_ error: Error) {
            guard (error as NSError).code != NSURLErrorCancelled else { return }
            owner.failure = true
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            owner.failure = true
        }

        private func presenter(for webView: WKWebView, frame: WKFrameInfo) -> UIViewController? {
            guard frame.isMainFrame,
                  frame.request.url?.scheme == bundledOrigin.scheme,
                  var presenter = webView.window?.rootViewController else { return nil }
            while let next = presenter.presentedViewController { presenter = next }
            return presenter
        }

        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            guard let presenter = presenter(for: webView, frame: frame) else { completionHandler(); return }
            let alert = UIAlertController(title: owner.shelf.title, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
            presenter.present(alert, animated: true)
        }

        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            guard let presenter = presenter(for: webView, frame: frame) else { completionHandler(false); return }
            let alert = UIAlertController(title: owner.shelf.title, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) })
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
            presenter.present(alert, animated: true)
        }

        func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String,
                     defaultText: String?, initiatedByFrame frame: WKFrameInfo,
                     completionHandler: @escaping (String?) -> Void) {
            guard let presenter = presenter(for: webView, frame: frame) else { completionHandler(nil); return }
            let alert = UIAlertController(title: owner.shelf.title, message: prompt, preferredStyle: .alert)
            alert.addTextField { $0.text = defaultText }
            alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(nil) })
            alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak alert] _ in
                completionHandler(alert?.textFields?.first?.text)
            })
            presenter.present(alert, animated: true)
        }

        func download(_ download: WKDownload, decideDestinationUsing response: URLResponse,
                      suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
            let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
            let name = (suggestedFilename as NSString).lastPathComponent
            do {
                try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: false)
                let url = directory.appendingPathComponent(name.isEmpty || name == "." || name == ".." ? "export.json" : name)
                files[ObjectIdentifier(download)] = url
                completionHandler(url)
            } catch {
                completionHandler(nil)
            }
        }

        func downloadDidFinish(_ download: WKDownload) {
            guard let url = files.removeValue(forKey: ObjectIdentifier(download)) else { return }
            owner.export = LocalExport(url: url)
        }

        func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
            if let url = files.removeValue(forKey: ObjectIdentifier(download)) {
                try? FileManager.default.removeItem(at: url.deletingLastPathComponent())
            }
        }
    }
}
