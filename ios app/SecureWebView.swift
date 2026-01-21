import SwiftUI
import WebKit
import UIKit

// =============================================================================
// SECURE WEB VIEW WITH iOS SCREENSHOT PROTECTION
// Uses the isSecureTextEntry technique to make content appear BLACK in screenshots
// This is the same technique used by banking apps and secure document viewers
// =============================================================================

struct SecureWebView: UIViewRepresentable {
    let url: URL
    
    func makeUIView(context: Context) -> SecureContainerView {
        let containerView = SecureContainerView()
        
        // Create WKWebView with configuration
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        
        // Enable JavaScript
        config.preferences.javaScriptEnabled = true
        
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.scrollView.bounces = false
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.backgroundColor = .black
        
        // Allow navigation gestures
        webView.allowsBackForwardNavigationGestures = true
        
        // Load the URL
        let request = URLRequest(url: url)
        webView.load(request)
        
        // Add webView to secure container
        containerView.addSecureSubview(webView)
        
        return containerView
    }
    
    func updateUIView(_ uiView: SecureContainerView, context: Context) {
        // No updates needed
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }
    
    class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        // Handle navigation
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            // Allow all navigation within the app
            decisionHandler(.allow)
        }
        
        // Handle OAuth redirects and popups
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            // Open popups in same webview (for OAuth)
            if navigationAction.targetFrame == nil {
                webView.load(navigationAction.request)
            }
            return nil
        }
        
        // Handle alerts
        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            // For now, just complete
            completionHandler()
        }
    }
}

// =============================================================================
// SECURE CONTAINER VIEW - The magic that prevents screenshots
// =============================================================================

class SecureContainerView: UIView {
    
    // The secure layer that iOS treats as protected content
    private var secureLayer: CALayer?
    private var secureTextField: UITextField?
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupSecureLayer()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupSecureLayer()
    }
    
    private func setupSecureLayer() {
        // Create a secure text field (isSecureTextEntry makes iOS protect it)
        let textField = UITextField()
        textField.isSecureTextEntry = true
        textField.isUserInteractionEnabled = false
        textField.alpha = 0.01 // Nearly invisible but still active
        
        // Add it to view hierarchy
        self.addSubview(textField)
        self.secureTextField = textField
        
        // Get the secure layer from the text field
        // iOS wraps secure text fields in a special layer that blocks screenshots
        if let secureView = textField.subviews.first(where: { 
            String(describing: type(of: $0)).contains("TextLayoutCanvasView") ||
            String(describing: type(of: $0)).contains("ContentView")
        }) {
            self.secureLayer = secureView.layer
        } else if let firstSubview = textField.subviews.first {
            self.secureLayer = firstSubview.layer
        }
        
        // Alternative method: Use layer from text field's superview after adding to hierarchy
        DispatchQueue.main.async { [weak self] in
            self?.tryAlternativeSecureMethod()
        }
    }
    
    private func tryAlternativeSecureMethod() {
        // Try to find the secure container layer
        guard let textField = secureTextField else { return }
        
        // Method 1: Check subviews recursively
        func findSecureLayer(in view: UIView) -> CALayer? {
            for subview in view.subviews {
                let typeName = String(describing: type(of: subview))
                if typeName.contains("Secure") || typeName.contains("TextLayout") {
                    return subview.layer
                }
                if let found = findSecureLayer(in: subview) {
                    return found
                }
            }
            return nil
        }
        
        if let foundLayer = findSecureLayer(in: textField) {
            self.secureLayer = foundLayer
            rearrangeSubviews()
        }
    }
    
    private func rearrangeSubviews() {
        // Move all content into the secure layer
        guard let secureLayer = secureLayer else { return }
        
        for subview in self.subviews {
            if subview != secureTextField {
                secureLayer.addSublayer(subview.layer)
            }
        }
    }
    
    func addSecureSubview(_ view: UIView) {
        // Add the view normally first
        view.translatesAutoresizingMaskIntoConstraints = false
        self.addSubview(view)
        
        NSLayoutConstraint.activate([
            view.topAnchor.constraint(equalTo: self.topAnchor),
            view.bottomAnchor.constraint(equalTo: self.bottomAnchor),
            view.leadingAnchor.constraint(equalTo: self.leadingAnchor),
            view.trailingAnchor.constraint(equalTo: self.trailingAnchor)
        ])
        
        // Apply the secure wrapper
        makeSecure(view: view)
    }
    
    private func makeSecure(view: UIView) {
        // Method: Wrap the view's layer in the secure text field's content
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let textField = self.secureTextField else { return }
            
            // Force layout
            textField.layoutIfNeeded()
            self.layoutIfNeeded()
            
            // The key: insert our content layer into the secure text field's layer hierarchy
            if let secureTrackingView = textField.subviews.first {
                // Move the content into the secure tracking view
                secureTrackingView.addSubview(view)
                view.frame = self.bounds
                
                // Auto-layout needs to be re-applied
                view.translatesAutoresizingMaskIntoConstraints = false
                NSLayoutConstraint.activate([
                    view.topAnchor.constraint(equalTo: secureTrackingView.topAnchor),
                    view.bottomAnchor.constraint(equalTo: secureTrackingView.bottomAnchor),
                    view.leadingAnchor.constraint(equalTo: secureTrackingView.leadingAnchor),
                    view.trailingAnchor.constraint(equalTo: secureTrackingView.trailingAnchor)
                ])
                
                // Make the secure tracking view fill the container
                secureTrackingView.translatesAutoresizingMaskIntoConstraints = false
                NSLayoutConstraint.activate([
                    secureTrackingView.topAnchor.constraint(equalTo: self.topAnchor),
                    secureTrackingView.bottomAnchor.constraint(equalTo: self.bottomAnchor),
                    secureTrackingView.leadingAnchor.constraint(equalTo: self.leadingAnchor),
                    secureTrackingView.trailingAnchor.constraint(equalTo: self.trailingAnchor)
                ])
            }
        }
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        
        // Ensure secure text field fills the view
        secureTextField?.frame = self.bounds
    }
}

// =============================================================================
// Screen Recording Detection
// =============================================================================

class ScreenRecordingDetector: ObservableObject {
    @Published var isBeingRecorded = false
    
    init() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(screenCaptureChanged),
            name: UIScreen.capturedDidChangeNotification,
            object: nil
        )
        
        // Check initial state
        isBeingRecorded = UIScreen.main.isCaptured
    }
    
    @objc private func screenCaptureChanged() {
        DispatchQueue.main.async {
            self.isBeingRecorded = UIScreen.main.isCaptured
        }
    }
}
