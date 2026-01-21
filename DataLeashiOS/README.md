# DataLeash iOS App

Native iOS app with **TRUE screenshot protection** using the `isSecureTextEntry` technique.

## ⚡ Key Features

- **Screenshot Protection**: Screenshots capture BLACK screen instead of content
- **Screen Recording Detection**: Detects and can respond to screen recordings
- **Native Performance**: Full WKWebView with native iOS experience
- **OAuth Support**: Works with Google/GitHub authentication

## 🔒 How Screenshot Protection Works

iOS has a special security mechanism for password fields (`isSecureTextEntry`). Any content rendered within a secure text field's layer hierarchy is protected at the OS kernel level.

This app:
1. Creates a UITextField with `isSecureTextEntry = true`
2. Embeds the WKWebView inside the secure text field's layer
3. iOS treats the entire WebView as "secure content"
4. Screenshots and screen recordings capture only BLACK

## 📱 Installation

### Option 1: Open in Xcode
1. Open `DataLeash.xcodeproj` in Xcode
2. Select your Team in Signing & Capabilities
3. Connect your iPhone
4. Build and run (⌘R)

### Option 2: Archive and Install
1. In Xcode: Product → Archive
2. Distribute App → Ad Hoc or Development
3. Install via Apple Configurator or TestFlight

## 🛠 Requirements

- Xcode 15.0+
- iOS 15.0+
- Apple Developer Account (for device testing)

## 📦 Structure

```
DataLeash/
├── DataLeashApp.swift     # App entry point
├── ContentView.swift      # Main view with loading state
├── SecureWebView.swift    # Core security implementation
├── Info.plist             # App configuration
└── Assets.xcassets/       # App icons and colors
```

## ⚠️ Important Notes

1. **The `isSecureTextEntry` technique works on REAL devices only** - The iOS Simulator does not enforce screenshot protection.

2. **This is the same technique used by banking apps** like Chase, Bank of America, etc.

3. **Screen recording also captures black** - iOS applies the same protection to screen recordings.

## 🔧 Customization

### Change the URL
Edit `ContentView.swift`:
```swift
SecureWebView(url: URL(string: "https://your-url.com")!)
```

### Add Screen Recording Warning
The `ScreenRecordingDetector` class can detect when screen recording starts. Use it to show a warning or hide content.

## 📄 License

MIT - Use as you wish!
