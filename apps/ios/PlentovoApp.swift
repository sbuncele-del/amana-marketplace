import Combine
import SwiftUI
import WebKit

@main
struct PlentovoApp: App {
    var body: some Scene {
        WindowGroup { ShopView() }
    }
}

private struct SavedPage: Codable, Identifiable {
    let title: String
    let url: URL

    var id: URL { url }
}

@MainActor
private final class Storefront: NSObject, ObservableObject, WKNavigationDelegate {
    static let home = URL(string: "https://www.plentovo.com/")!
    private static let bookmarkKey = "savedStorefrontPages"

    let webView = WKWebView()
    private var pageObservation: AnyCancellable?
    @Published var saved: [SavedPage] = []
    @Published var currentPage: SavedPage?
    @Published var canGoBack = false
    @Published var loadFailed = false

    override init() {
        super.init()
        webView.navigationDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        if let data = UserDefaults.standard.data(forKey: Self.bookmarkKey),
           let pages = try? JSONDecoder().decode([SavedPage].self, from: data) {
            saved = pages
        }
        pageObservation = webView.publisher(for: \.url)
            .combineLatest(webView.publisher(for: \.title))
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in self?.updateCurrentPage() }
        open(Self.home)
    }

    func open(_ url: URL) {
        loadFailed = false
        webView.load(URLRequest(url: url))
    }

    func retry() {
        open(webView.url ?? Self.home)
    }

    func toggleSaved(_ page: SavedPage) {
        if let index = saved.firstIndex(where: { $0.id == page.id }) {
            saved.remove(at: index)
        } else {
            saved.insert(page, at: 0)
        }
        persist()
    }

    func removeSaved(at offsets: IndexSet) {
        saved.remove(atOffsets: offsets)
        persist()
    }

    private func persist() {
        if let data = try? JSONEncoder().encode(saved) {
            UserDefaults.standard.set(data, forKey: Self.bookmarkKey)
        }
    }

    private func isStorefront(_ url: URL) -> Bool {
        url.scheme == "https" && ["plentovo.com", "www.plentovo.com"].contains(url.host ?? "")
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        updateCurrentPage()
    }

    private func updateCurrentPage() {
        canGoBack = webView.canGoBack
        guard let url = webView.url, isStorefront(url),
              var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            return
        }
        components.query = nil
        components.fragment = nil
        currentPage = components.url.map { SavedPage(title: webView.title ?? "Plentovo", url: $0) }
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        currentPage = nil
        loadFailed = false
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        showFailure(error)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        showFailure(error)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        loadFailed = true
    }

    private func showFailure(_ error: Error) {
        let failure = error as NSError
        if failure.domain == NSURLErrorDomain && failure.code == NSURLErrorCancelled { return }
        canGoBack = webView.canGoBack
        loadFailed = true
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard action.targetFrame?.isMainFrame != false, let url = action.request.url else {
            decisionHandler(.allow)
            return
        }
        if isStorefront(url) {
            if action.targetFrame == nil {
                decisionHandler(.cancel)
                webView.load(action.request)
            } else {
                decisionHandler(.allow)
            }
        } else {
            decisionHandler(.cancel)
            if ["https", "mailto", "tel"].contains(url.scheme ?? "") {
                UIApplication.shared.open(url)
            }
        }
    }
}

private struct ShopView: View {
    @StateObject private var store = Storefront()
    @State private var showingSaved = false

    var body: some View {
        VStack(spacing: 0) {
            ZStack {
                ShopWebView(webView: store.webView)
                if store.loadFailed {
                    ContentUnavailableView {
                        Label("Store unavailable", systemImage: "wifi.exclamationmark")
                    } description: {
                        Text("Check your connection and try again.")
                    } actions: {
                        Button("Try again", action: store.retry)
                            .buttonStyle(.borderedProminent)
                    }
                    .background(.background)
                }
            }
            Divider()
            HStack {
                Button { store.webView.goBack() } label: {
                    Label("Back", systemImage: "chevron.left")
                }
                .disabled(!store.canGoBack)
                Spacer()
                Button { store.open(Storefront.home) } label: {
                    Label("Home", systemImage: "house")
                }
                Spacer()
                Button { showingSaved = true } label: {
                    Label("Saved pages", systemImage: "bookmark")
                }
                if let page = store.currentPage {
                    Spacer()
                    ShareLink(item: page.url)
                        .accessibilityLabel("Share page")
                }
            }
            .labelStyle(.iconOnly)
            .buttonStyle(.bordered)
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .sheet(isPresented: $showingSaved) {
            NavigationStack {
                List {
                    if let page = store.currentPage {
                        let isSaved = store.saved.contains { $0.id == page.id }
                        Button(isSaved ? "Remove current page" : "Save current page") {
                            store.toggleSaved(page)
                        }
                    }
                    ForEach(store.saved) { page in
                        Button(page.title) {
                            store.open(page.url)
                            showingSaved = false
                        }
                    }
                    .onDelete(perform: store.removeSaved)
                }
                .navigationTitle("Saved pages")
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Done") { showingSaved = false }
                    }
                }
            }
        }
    }
}

private struct ShopWebView: UIViewRepresentable {
    let webView: WKWebView

    func makeUIView(context: Context) -> WKWebView { webView }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
