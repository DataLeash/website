import SwiftUI
import PhotosUI

// MARK: - Chat View (Real Data)

struct ChatView: View {
    let friend: Friend
    @State private var messages: [ChatService.Message] = []
    @State private var newMessage = ""
    @State private var isLoading = true
    @State private var isSending = false
    @State private var error: String?
    @State private var showFilePicker = false
    @State private var showImagePicker = false
    @State private var showCamera = false
    @State private var selectedImage: UIImage?
    @State private var isUploadingImage = false
    @State private var uploadProgress: Double = 0
    
    var body: some View {
        VStack(spacing: 0) {
            // Messages List
            if isLoading {
                Spacer()
                ProgressView().tint(.cyan)
                Spacer()
            } else if let error = error {
                Spacer()
                VStack(spacing: 15) {
                    Text(error)
                        .foregroundColor(.red)
                    Button("Retry") {
                        Task { await loadMessages() }
                    }
                    .foregroundColor(.cyan)
                }
                Spacer()
            } else {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            if messages.isEmpty {
                                VStack(spacing: 10) {
                                    Image(systemName: "bubble.left.and.bubble.right")
                                        .font(.system(size: 40))
                                        .foregroundColor(.gray)
                                    Text("No messages yet")
                                        .foregroundColor(.gray)
                                    Text("Start the conversation!")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                }
                                .padding(.top, 100)
                            } else {
                                ForEach(messages) { message in
                                    MessageBubble(
                                        message: message,
                                        isFromMe: message.senderId == AuthService.shared.currentUser?.id
                                    )
                                    .id(message.id)
                                }
                            }
                        }
                        .padding()
                    }
                    .onChange(of: messages.count) { _, _ in
                        if let lastMessage = messages.last {
                            withAnimation {
                                proxy.scrollTo(lastMessage.id, anchor: .bottom)
                            }
                        }
                    }
                }
            }
            
            // Upload progress bar
            if isUploadingImage {
                VStack(spacing: 4) {
                    HStack {
                        Image(systemName: "photo.fill")
                            .foregroundColor(.cyan)
                        Text("Uploading protected image...")
                            .font(.caption)
                            .foregroundColor(.gray)
                        Spacer()
                        Text("\(Int(uploadProgress * 100))%")
                            .font(.caption)
                            .foregroundColor(.cyan)
                    }
                    ProgressView(value: uploadProgress)
                        .tint(.cyan)
                }
                .padding(.horizontal)
                .padding(.vertical, 8)
                .background(Color.black.opacity(0.5))
            }
            
            // Message Input
            HStack(spacing: 10) {
                // Camera button
                Button(action: { showCamera = true }) {
                    Image(systemName: "camera.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.gray)
                }
                .disabled(isUploadingImage)
                
                // Photo library button
                Button(action: { showImagePicker = true }) {
                    Image(systemName: "photo.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.gray)
                }
                .disabled(isUploadingImage)
                
                // File attach button
                Button(action: { showFilePicker = true }) {
                    Image(systemName: "paperclip")
                        .font(.system(size: 20))
                        .foregroundColor(.gray)
                }
                .disabled(isUploadingImage)
                
                // Text field
                TextField("Message...", text: $newMessage)
                    .padding(10)
                    .background(Color.white.opacity(0.1))
                    .cornerRadius(20)
                    .foregroundColor(.white)
                
                // Send button
                Button(action: sendMessage) {
                    if isSending {
                        ProgressView().tint(.cyan)
                    } else {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.title)
                            .foregroundColor(newMessage.isEmpty ? .gray : .cyan)
                    }
                }
                .disabled(newMessage.isEmpty || isSending || isUploadingImage)
            }
            .padding()
            .background(Color(red: 0.06, green: 0.12, blue: 0.2))
        }
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle(friend.friendName ?? friend.friendEmail ?? "Chat")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showFilePicker) {
            ShareFileInChatSheet(friendId: friend.friendId) {
                Task { await loadMessages() }
            }
        }
        .sheet(isPresented: $showImagePicker) {
            ImagePickerView(image: $selectedImage)
        }
        .sheet(isPresented: $showCamera) {
            CameraPickerView(image: $selectedImage)
        }
        .onChange(of: selectedImage) { _, newImage in
            if let image = newImage {
                Task { await uploadAndShareImage(image) }
                selectedImage = nil
            }
        }
        .task {
            await loadMessages()
        }
        .refreshable {
            await loadMessages()
        }
    }
    
    private func loadMessages() async {
        isLoading = true
        error = nil
        
        // Determine which ID to use for the conversation
        let friendUserId = (friend.userId == AuthService.shared.currentUser?.id) ? friend.friendId : friend.userId
        
        do {
            messages = try await ChatService.shared.getMessages(withUserId: friendUserId)
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    private func sendMessage() {
        guard !newMessage.isEmpty else { return }
        
        let messageText = newMessage
        newMessage = ""
        isSending = true
        
        // Determine which ID to use for the conversation
        let friendUserId = (friend.userId == AuthService.shared.currentUser?.id) ? friend.friendId : friend.userId
        
        Task {
            do {
                let sent = try await ChatService.shared.sendMessage(to: friendUserId, content: messageText)
                messages.append(sent)
            } catch {
                newMessage = messageText // Restore message on error
                self.error = error.localizedDescription
            }
            isSending = false
        }
    }
    
    private func uploadAndShareImage(_ image: UIImage) async {
        isUploadingImage = true
        uploadProgress = 0
        
        // Determine which ID to use for the conversation
        let friendUserId = (friend.userId == AuthService.shared.currentUser?.id) ? friend.friendId : friend.userId
        
        do {
            // Simulate progress (actual upload uses URLSession)
            for i in 1...5 {
                try await Task.sleep(nanoseconds: 100_000_000) // 0.1s
                await MainActor.run { uploadProgress = Double(i) * 0.15 }
            }
            
            // Upload image and create protected file
            let fileId = try await ChatService.shared.uploadImageToDataLeash(image: image)
            await MainActor.run { uploadProgress = 0.9 }
            
            // Share in chat
            try await ChatService.shared.shareFile(fileId: fileId, withFriendId: friendUserId)
            await MainActor.run { uploadProgress = 1.0 }
            
            // Reload messages
            await loadMessages()
        } catch {
            await MainActor.run {
                self.error = "Failed to send image: \(error.localizedDescription)"
            }
        }
        
        await MainActor.run {
            isUploadingImage = false
            uploadProgress = 0
        }
    }
}

// MARK: - Message Bubble

struct MessageBubble: View {
    let message: ChatService.Message
    let isFromMe: Bool
    
    var body: some View {
        HStack {
            if isFromMe { Spacer() }
            
            VStack(alignment: isFromMe ? .trailing : .leading, spacing: 4) {
                // File attachment if present
                if let fileId = message.fileId {
                    NavigationLink(destination: FileAccessView(fileId: fileId)) {
                        HStack {
                            Image(systemName: "doc.fill")
                                .foregroundColor(.cyan)
                            Text("Shared File")
                                .font(.caption)
                                .foregroundColor(.white)
                            Image(systemName: "arrow.right.circle")
                                .foregroundColor(.cyan)
                        }
                        .padding(10)
                        .background(Color.cyan.opacity(0.2))
                        .cornerRadius(12)
                    }
                }
                
                // Message content
                if let content = message.content, !content.isEmpty {
                    Text(content)
                        .foregroundColor(.white)
                        .padding(12)
                        .background(isFromMe ? Color.cyan : Color.white.opacity(0.15))
                        .cornerRadius(16)
                }
                
                // Time
                Text(message.createdAt, style: .time)
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
            
            if !isFromMe { Spacer() }
        }
    }
}

// MARK: - Share File In Chat Sheet

struct ShareFileInChatSheet: View {
    let friendId: String
    let onComplete: () -> Void
    @Environment(\.dismiss) var dismiss
    @State private var files: [FilesManagementService.UserFile] = []
    @State private var isLoading = true
    @State private var isSharing = false
    
    var body: some View {
        NavigationStack {
            VStack {
                if isLoading {
                    ProgressView().tint(.cyan)
                } else if files.isEmpty {
                    VStack(spacing: 15) {
                        Image(systemName: "doc.badge.plus")
                            .font(.system(size: 50))
                            .foregroundColor(.gray)
                        Text("No files to share")
                            .foregroundColor(.gray)
                        Text("Upload some files first")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                } else {
                    List {
                        ForEach(files.filter { !$0.isKilled }) { file in
                            Button(action: { shareFile(file) }) {
                                HStack {
                                    Image(systemName: file.iconName)
                                        .foregroundColor(.cyan)
                                    VStack(alignment: .leading) {
                                        Text(file.originalName)
                                            .foregroundColor(.white)
                                        Text("\(file.viewCount) views")
                                            .font(.caption)
                                            .foregroundColor(.gray)
                                    }
                                    Spacer()
                                    if isSharing {
                                        ProgressView().tint(.cyan)
                                    } else {
                                        Image(systemName: "paperplane.fill")
                                            .foregroundColor(.cyan)
                                    }
                                }
                            }
                            .disabled(isSharing)
                            .listRowBackground(Color.white.opacity(0.05))
                        }
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                }
            }
            .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
            .navigationTitle("Share File")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(.cyan)
                }
            }
            .task {
                do {
                    files = try await FilesManagementService.shared.getMyFiles()
                } catch { }
                isLoading = false
            }
        }
    }
    
    private func shareFile(_ file: FilesManagementService.UserFile) {
        isSharing = true
        Task {
            do {
                try await ChatService.shared.shareFile(fileId: file.id, withFriendId: friendId)
                onComplete()
                dismiss()
            } catch {
                isSharing = false
            }
        }
    }
}

#Preview {
    NavigationStack {
        ChatView(friend: Friend(
            id: "1",
            userId: "user1",
            friendId: "friend1",
            status: .accepted,
            friendEmail: "friend@example.com",
            friendName: "Alex Smith"
        ))
    }
}

// MARK: - Image Picker (Photo Library)

struct ImagePickerView: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Environment(\.dismiss) var dismiss
    
    func makeUIViewController(context: Context) -> PHPickerViewController {
        var config = PHPickerConfiguration()
        config.filter = .images
        config.selectionLimit = 1
        
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: PHPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, PHPickerViewControllerDelegate {
        let parent: ImagePickerView
        
        init(_ parent: ImagePickerView) {
            self.parent = parent
        }
        
        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            parent.dismiss()
            
            guard let provider = results.first?.itemProvider else { return }
            
            if provider.canLoadObject(ofClass: UIImage.self) {
                provider.loadObject(ofClass: UIImage.self) { [weak self] image, _ in
                    DispatchQueue.main.async {
                        self?.parent.image = image as? UIImage
                    }
                }
            }
        }
    }
}

// MARK: - Camera Picker

struct CameraPickerView: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Environment(\.dismiss) var dismiss
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraPickerView
        
        init(_ parent: CameraPickerView) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            parent.dismiss()
            
            if let image = info[.originalImage] as? UIImage {
                parent.image = image
            }
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}
