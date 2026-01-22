import SwiftUI
import UIKit

// MARK: - Secure Container
// Wraps content in isSecureTextEntry container for screenshot protection
// Content appears BLACK in screenshots - this is the Telegram technique

struct SecureContainer<Content: View>: UIViewRepresentable {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    func makeUIView(context: Context) -> SecureContainerUIView {
        let secureView = SecureContainerUIView()
        
        // Create hosting controller for SwiftUI content
        let hostingController = UIHostingController(rootView: content)
        hostingController.view.backgroundColor = .clear
        
        secureView.setContent(hostingController.view)
        context.coordinator.hostingController = hostingController
        
        return secureView
    }
    
    func updateUIView(_ uiView: SecureContainerUIView, context: Context) {
        context.coordinator.hostingController?.rootView = content
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }
    
    class Coordinator {
        var hostingController: UIHostingController<Content>?
    }
}

// MARK: - Secure Container UIView

class SecureContainerUIView: UIView {
    private var secureTextField: UITextField!
    private var contentView: UIView?
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupSecureField()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupSecureField()
    }
    
    private func setupSecureField() {
        backgroundColor = .clear
        
        // Create secure text field - this is the magic!
        secureTextField = UITextField()
        secureTextField.isSecureTextEntry = true
        secureTextField.backgroundColor = .clear
        secureTextField.isUserInteractionEnabled = true
        
        addSubview(secureTextField)
        secureTextField.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            secureTextField.topAnchor.constraint(equalTo: topAnchor),
            secureTextField.bottomAnchor.constraint(equalTo: bottomAnchor),
            secureTextField.leadingAnchor.constraint(equalTo: leadingAnchor),
            secureTextField.trailingAnchor.constraint(equalTo: trailingAnchor)
        ])
        
        // Force layout to create the secure container subview
        secureTextField.layoutIfNeeded()
    }
    
    func setContent(_ view: UIView) {
        contentView = view
        view.translatesAutoresizingMaskIntoConstraints = false
        
        // Add content inside the secure text field's first subview (the secure container)
        if let secureContainer = secureTextField.subviews.first {
            secureContainer.addSubview(view)
            secureContainer.isUserInteractionEnabled = true
            
            // Make secure container fill the text field
            secureContainer.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                secureContainer.topAnchor.constraint(equalTo: secureTextField.topAnchor),
                secureContainer.bottomAnchor.constraint(equalTo: secureTextField.bottomAnchor),
                secureContainer.leadingAnchor.constraint(equalTo: secureTextField.leadingAnchor),
                secureContainer.trailingAnchor.constraint(equalTo: secureTextField.trailingAnchor)
            ])
            
            // Make content view fill the secure container
            NSLayoutConstraint.activate([
                view.topAnchor.constraint(equalTo: secureContainer.topAnchor),
                view.bottomAnchor.constraint(equalTo: secureContainer.bottomAnchor),
                view.leadingAnchor.constraint(equalTo: secureContainer.leadingAnchor),
                view.trailingAnchor.constraint(equalTo: secureContainer.trailingAnchor)
            ])
        } else {
            // Fallback - add directly (won't have screenshot protection)
            addSubview(view)
            NSLayoutConstraint.activate([
                view.topAnchor.constraint(equalTo: topAnchor),
                view.bottomAnchor.constraint(equalTo: bottomAnchor),
                view.leadingAnchor.constraint(equalTo: leadingAnchor),
                view.trailingAnchor.constraint(equalTo: trailingAnchor)
            ])
        }
    }
    
    // Forward touches to content
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        guard let contentView = contentView else {
            return super.hitTest(point, with: event)
        }
        
        let convertedPoint = contentView.convert(point, from: self)
        if let hitView = contentView.hitTest(convertedPoint, with: event) {
            return hitView
        }
        return super.hitTest(point, with: event)
    }
}
