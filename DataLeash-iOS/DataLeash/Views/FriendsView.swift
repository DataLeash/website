import SwiftUI

struct FriendsView: View {
    @State private var friends: [Friend] = []
    @State private var isLoading = false
    @State private var error: String?
    @State private var showAddFriendAlert = false
    @State private var newFriendEmail = ""
    
    var body: some View {
        VStack(spacing: 0) {
            if isLoading && friends.isEmpty {
                Spacer()
                ProgressView().tint(.cyan)
                Spacer()
            } else if let error = error {
                VStack(spacing: 15) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 50))
                        .foregroundColor(.red)
                    Text(error)
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                    Button("Retry") { loadFriends() }
                        .foregroundColor(.cyan)
                }
                .padding()
            } else if friends.isEmpty {
                VStack(spacing: 20) {
                    Image(systemName: "person.2.slash")
                        .font(.system(size: 60))
                        .foregroundColor(.gray)
                    Text("No friends yet")
                        .font(.title3)
                        .foregroundColor(.white)
                    Text("Add friends to chat and share files")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                    Button("Add Friend") { showAddFriendAlert = true }
                        .padding()
                        .background(Color.cyan)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List {
                    // Pending Requests Received
                    let pendingReceived = friends.filter { 
                        $0.status == .pending && $0.userId != AuthService.shared.currentUser?.id 
                    }
                    if !pendingReceived.isEmpty {
                        Section(header: Text("Friend Requests").foregroundColor(.cyan)) {
                            ForEach(pendingReceived) { friend in
                                PendingFriendRow(friend: friend) {
                                    acceptRequest(friend)
                                }
                            }
                        }
                    }
                    
                    // Accepted Friends (with chat navigation)
                    let accepted = friends.filter { $0.status == .accepted }
                    if !accepted.isEmpty {
                        Section(header: Text("Friends").foregroundColor(.white)) {
                            ForEach(accepted) { friend in
                                NavigationLink(destination: ChatView(friend: friend)) {
                                    FriendChatRow(friend: friend)
                                }
                                .listRowBackground(Color.white.opacity(0.05))
                            }
                        }
                    }
                    
                    // Sent Requests
                    let sent = friends.filter { 
                        $0.status == .pending && $0.userId == AuthService.shared.currentUser?.id 
                    }
                    if !sent.isEmpty {
                        Section(header: Text("Pending").foregroundColor(.gray)) {
                            ForEach(sent) { friend in
                                HStack {
                                    Image(systemName: "person.circle")
                                        .font(.title2)
                                        .foregroundColor(.gray)
                                    VStack(alignment: .leading) {
                                        Text(friend.friendName ?? "Unknown")
                                            .foregroundColor(.white)
                                        Text(friend.friendEmail ?? "")
                                            .font(.caption)
                                            .foregroundColor(.gray)
                                    }
                                    Spacer()
                                    Text("Pending")
                                        .font(.caption)
                                        .foregroundColor(.orange)
                                }
                                .listRowBackground(Color.white.opacity(0.05))
                            }
                        }
                    }
                }
                .listStyle(.insetGrouped)
                .scrollContentBackground(.hidden)
            }
        }
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("Friends")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showAddFriendAlert = true }) {
                    Image(systemName: "person.badge.plus")
                        .foregroundColor(.cyan)
                }
            }
        }
        .onAppear { loadFriends() }
        .refreshable { loadFriends() }
        .alert("Add Friend", isPresented: $showAddFriendAlert) {
            TextField("Email", text: $newFriendEmail)
                .textInputAutocapitalization(.never)
                .keyboardType(.emailAddress)
            Button("Cancel", role: .cancel) { newFriendEmail = "" }
            Button("Add") { sendRequest() }
        } message: {
            Text("Enter their email address")
        }
    }
    
    private func loadFriends() {
        isLoading = true
        error = nil
        Task {
            do {
                friends = try await SocialService.shared.getFriends()
            } catch {
                self.error = error.localizedDescription
            }
            isLoading = false
        }
    }
    
    private func sendRequest() {
        guard !newFriendEmail.isEmpty else { return }
        Task {
            do {
                try await SocialService.shared.sendFriendRequest(toEmail: newFriendEmail)
                newFriendEmail = ""
                loadFriends()
            } catch {
                self.error = error.localizedDescription
            }
        }
    }
    
    private func acceptRequest(_ friend: Friend) {
        Task {
            do {
                try await SocialService.shared.acceptRequest(friendshipId: friend.id)
                loadFriends()
            } catch {
                self.error = error.localizedDescription
            }
        }
    }
}

// MARK: - Friend Chat Row

struct FriendChatRow: View {
    let friend: Friend
    
    var body: some View {
        HStack(spacing: 12) {
            ZStack(alignment: .bottomTrailing) {
                Image(systemName: "person.circle.fill")
                    .font(.system(size: 45))
                    .foregroundColor(.gray)
                Circle()
                    .fill(Color.green)
                    .frame(width: 12, height: 12)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(friend.friendName ?? "Unknown")
                    .font(.headline)
                    .foregroundColor(.white)
                Text(friend.friendEmail ?? "")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            Image(systemName: "message.fill")
                .foregroundColor(.cyan)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Pending Friend Row

struct PendingFriendRow: View {
    let friend: Friend
    let onAccept: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "person.circle.fill")
                .font(.system(size: 40))
                .foregroundColor(.gray)
            
            VStack(alignment: .leading) {
                Text(friend.friendName ?? "Unknown")
                    .font(.headline)
                    .foregroundColor(.white)
                Text(friend.friendEmail ?? "")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            Button(action: onAccept) {
                Text("Accept")
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.cyan)
                    .foregroundColor(.white)
                    .cornerRadius(8)
            }
        }
        .listRowBackground(Color.white.opacity(0.05))
    }
}

#Preview {
    NavigationStack {
        FriendsView()
    }
}
