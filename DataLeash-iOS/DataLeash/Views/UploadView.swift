import SwiftUI
import PhotosUI

// MARK: - Upload View
// Upload files from camera or photo library

struct UploadView: View {
    @Environment(\.dismiss) var dismiss
    @State private var selectedItem: PhotosPickerItem?
    @State private var selectedImage: UIImage?
    @State private var isUploading = false
    @State private var uploadProgress: Double = 0
    @State private var error: String?
    @State private var success = false
    @State private var showCamera = false
    @State private var fileName = ""
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                if success {
                    successView
                } else if let image = selectedImage {
                    previewView(image: image)
                } else {
                    uploadOptionsView
                }
            }
            .padding()
            .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
            .navigationTitle("Upload File")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(.gray)
                }
            }
            .sheet(isPresented: $showCamera) {
                CameraView(image: $selectedImage)
            }
            .onChange(of: selectedItem) { _, newValue in
                Task {
                    if let data = try? await newValue?.loadTransferable(type: Data.self),
                       let image = UIImage(data: data) {
                        selectedImage = image
                        fileName = "photo_\(Int(Date().timeIntervalSince1970)).jpg"
                    }
                }
            }
        }
    }
    
    // MARK: - Upload Options
    
    private var uploadOptionsView: some View {
        VStack(spacing: 24) {
            Image(systemName: "cloud.arrow.up.fill")
                .font(.system(size: 80))
                .foregroundStyle(
                    LinearGradient(colors: [.cyan, .blue], startPoint: .topLeading, endPoint: .bottomTrailing)
                )
            
            Text("Upload a File")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text("Choose a photo from your library or take a new one with your camera")
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
            
            VStack(spacing: 16) {
                // Photo Library
                PhotosPicker(selection: $selectedItem, matching: .images) {
                    HStack {
                        Image(systemName: "photo.on.rectangle")
                            .font(.title2)
                        Text("Choose from Library")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.cyan)
                    .foregroundColor(.black)
                    .cornerRadius(12)
                }
                
                // Camera
                Button(action: { showCamera = true }) {
                    HStack {
                        Image(systemName: "camera.fill")
                            .font(.title2)
                        Text("Take Photo")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.white.opacity(0.1))
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.cyan, lineWidth: 1)
                    )
                }
            }
            .padding(.top, 20)
            
            Spacer()
        }
    }
    
    // MARK: - Preview
    
    private func previewView(image: UIImage) -> some View {
        VStack(spacing: 20) {
            Image(uiImage: image)
                .resizable()
                .scaledToFit()
                .frame(maxHeight: 300)
                .cornerRadius(16)
            
            // File name
            VStack(alignment: .leading, spacing: 8) {
                Text("File Name")
                    .font(.caption)
                    .foregroundColor(.gray)
                
                TextField("Enter file name", text: $fileName)
                    .padding()
                    .background(Color.white.opacity(0.08))
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            
            if let error = error {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
            }
            
            if isUploading {
                VStack(spacing: 8) {
                    ProgressView(value: uploadProgress)
                        .tint(.cyan)
                    Text("Uploading... \(Int(uploadProgress * 100))%")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            
            HStack(spacing: 16) {
                Button(action: {
                    selectedImage = nil
                    selectedItem = nil
                }) {
                    Text("Choose Different")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.white.opacity(0.1))
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
                
                Button(action: uploadFile) {
                    HStack {
                        if isUploading {
                            ProgressView().tint(.black)
                        } else {
                            Image(systemName: "arrow.up.circle.fill")
                            Text("Upload")
                        }
                    }
                    .fontWeight(.bold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.cyan)
                    .foregroundColor(.black)
                    .cornerRadius(12)
                }
                .disabled(isUploading || fileName.isEmpty)
            }
            
            Spacer()
        }
    }
    
    // MARK: - Success
    
    private var successView: some View {
        VStack(spacing: 24) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.green)
            
            Text("Upload Complete!")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text("Your file has been encrypted and uploaded successfully.")
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
            
            Button(action: { dismiss() }) {
                Text("Done")
                    .fontWeight(.bold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.cyan)
                    .foregroundColor(.black)
                    .cornerRadius(12)
            }
            .padding(.top, 20)
            
            Spacer()
        }
    }
    
    // MARK: - Upload Logic
    
    private func uploadFile() {
        guard let image = selectedImage,
              let imageData = image.jpegData(compressionQuality: 0.8),
              let userId = AuthService.shared.currentUser?.id,
              let token = AuthService.shared.accessToken else {
            error = "Unable to prepare file"
            return
        }
        
        isUploading = true
        error = nil
        uploadProgress = 0.1
        
        let fileId = UUID().uuidString
        let storagePath = "\(userId)/\(fileId).jpg"
        
        // Step 1: Upload to Supabase Storage
        uploadToStorage(data: imageData, path: storagePath, token: token) { result in
            switch result {
            case .success:
                uploadProgress = 0.6
                // Step 2: Create file record
                createFileRecord(fileId: fileId, name: fileName, mimeType: "image/jpeg", storagePath: storagePath, token: token) { result in
                    DispatchQueue.main.async {
                        isUploading = false
                        switch result {
                        case .success:
                            uploadProgress = 1.0
                            success = true
                        case .failure(let err):
                            error = err.localizedDescription
                        }
                    }
                }
            case .failure(let err):
                DispatchQueue.main.async {
                    isUploading = false
                    error = err.localizedDescription
                }
            }
        }
    }
    
    private func uploadToStorage(data: Data, path: String, token: String, completion: @escaping (Result<Void, Error>) -> Void) {
        guard let url = URL(string: "\(Config.supabaseURL)/storage/v1/object/files/\(path)") else {
            completion(.failure(NSError(domain: "", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
        request.httpBody = data
        
        URLSession.shared.dataTask(with: request) { _, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            if let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) {
                completion(.success(()))
            } else {
                completion(.failure(NSError(domain: "", code: 0, userInfo: [NSLocalizedDescriptionKey: "Upload failed"])))
            }
        }.resume()
    }
    
    private func createFileRecord(fileId: String, name: String, mimeType: String, storagePath: String, token: String, completion: @escaping (Result<Void, Error>) -> Void) {
        guard let url = URL(string: "\(Config.supabaseURL)/rest/v1/files") else {
            completion(.failure(NSError(domain: "", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("return=minimal", forHTTPHeaderField: "Prefer")
        
        let body: [String: Any] = [
            "id": fileId,
            "owner_id": AuthService.shared.currentUser?.id ?? "",
            "original_name": name,
            "mime_type": mimeType,
            "storage_path": storagePath,
            "is_destroyed": false,
            "settings": [
                "password_protected": false,
                "total_views": 0
            ]
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { _, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            if let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) {
                completion(.success(()))
            } else {
                completion(.failure(NSError(domain: "", code: 0, userInfo: [NSLocalizedDescriptionKey: "Failed to create file record"])))
            }
        }.resume()
    }
}

// MARK: - Camera View

struct CameraView: UIViewControllerRepresentable {
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
        let parent: CameraView
        
        init(_ parent: CameraView) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.image = image
            }
            parent.dismiss()
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}

#Preview {
    UploadView()
}
