import SwiftUI
import UIKit
import WebKit

/// Instagram (sito web) dentro un browser interno, con lo script anti-reel iniettato
/// in ogni pagina. Login e sessione restano salvati come in Safari.
struct InstagramView: UIViewRepresentable {
    static let home = URL(string: "https://www.instagram.com/?variant=following")!

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()                 // cookie persistenti = resti loggato
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        // Si presenta come Safari mobile, così Instagram serve il sito completo
        config.applicationNameForUserAgent = "Version/18.0 Mobile/15E148 Safari/604.1"

        if let url = Bundle.main.url(forResource: "instagram-lite", withExtension: "js"),
           let source = try? String(contentsOf: url, encoding: .utf8) {
            let script = WKUserScript(source: source,
                                      injectionTime: .atDocumentStart,
                                      forMainFrameOnly: true)
            config.userContentController.addUserScript(script)
        }

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true   // swipe da sinistra = indietro

        let refresh = UIRefreshControl()
        refresh.addTarget(context.coordinator, action: #selector(Coordinator.pullToRefresh(_:)), for: .valueChanged)
        webView.scrollView.refreshControl = refresh

        context.coordinator.webView = webView
        webView.load(URLRequest(url: Self.home))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        weak var webView: WKWebView?

        private let allowedHosts = ["instagram.com", "facebook.com", "fbcdn.net", "cdninstagram.com"]

        private func isAllowed(_ host: String) -> Bool {
            allowedHosts.contains { host == $0 || host.hasSuffix("." + $0) }
        }

        @objc func pullToRefresh(_ sender: UIRefreshControl) {
            webView?.reload()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { sender.endRefreshing() }
        }

        // MARK: Navigazione

        func webView(_ webView: WKWebView,
                     decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { return decisionHandler(.allow) }
            let scheme = url.scheme?.lowercased() ?? ""

            // instagram://, itms-apps:// ecc.: non far aprire l'app vera o l'App Store
            if !["http", "https", "about", "blob", "data"].contains(scheme) {
                return decisionHandler(.cancel)
            }

            let isMainFrame = action.targetFrame?.isMainFrame ?? true
            if isMainFrame, let host = url.host?.lowercased() {
                // Link esterni (siti, shop, ecc.) -> Safari
                if !isAllowed(host) {
                    UIApplication.shared.open(url)
                    return decisionHandler(.cancel)
                }
                // Feed Reels -> home (doppia sicurezza oltre allo script)
                if url.path == "/reels" || url.path == "/reels/" {
                    webView.load(URLRequest(url: InstagramView.home))
                    return decisionHandler(.cancel)
                }
            }
            decisionHandler(.allow)
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            webView.reload()
        }

        // MARK: Finestre e popup

        func webView(_ webView: WKWebView,
                     createWebViewWith configuration: WKWebViewConfiguration,
                     for navigationAction: WKNavigationAction,
                     windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = navigationAction.request.url {
                if let host = url.host?.lowercased(), isAllowed(host) {
                    webView.load(URLRequest(url: url))
                } else {
                    UIApplication.shared.open(url)
                }
            }
            return nil
        }

        private func present(_ alert: UIAlertController, from webView: WKWebView) {
            var top = webView.window?.rootViewController
            while let next = top?.presentedViewController { top = next }
            top?.present(alert, animated: true)
        }

        func webView(_ webView: WKWebView,
                     runJavaScriptAlertPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo,
                     completionHandler: @escaping () -> Void) {
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
            present(alert, from: webView)
        }

        func webView(_ webView: WKWebView,
                     runJavaScriptConfirmPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo,
                     completionHandler: @escaping (Bool) -> Void) {
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "Annulla", style: .cancel) { _ in completionHandler(false) })
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
            present(alert, from: webView)
        }
    }
}
