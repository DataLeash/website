import Foundation
import UIKit
import Combine

// MARK: - Screen Protection Manager
// Monitors for screenshots and screen recording

class ScreenProtectionManager: ObservableObject {
    static let shared = ScreenProtectionManager()
    
    @Published var isRecording = false
    @Published var screenshotTaken = false
    @Published var showBlocker = false
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        // Check initial state
        isRecording = UIScreen.main.isCaptured
        
        // Monitor screen recording
        NotificationCenter.default.publisher(for: UIScreen.capturedDidChangeNotification)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.isRecording = UIScreen.main.isCaptured
                self?.updateBlocker()
            }
            .store(in: &cancellables)
        
        // Monitor screenshots
        NotificationCenter.default.publisher(for: UIApplication.userDidTakeScreenshotNotification)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.handleScreenshot()
            }
            .store(in: &cancellables)
        
        updateBlocker()
    }
    
    private func handleScreenshot() {
        screenshotTaken = true
        showBlocker = true
        
        // Log the screenshot attempt
        Task {
            if let email = AuthService.shared.currentUser?.email {
                await FileService.shared.logAccess(
                    fileId: "global",
                    action: "screenshot_attempt",
                    email: email
                )
            }
        }
        
        // Keep blocker visible for 5 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) { [weak self] in
            self?.screenshotTaken = false
            self?.updateBlocker()
        }
    }
    
    private func updateBlocker() {
        showBlocker = isRecording || screenshotTaken
    }
}
