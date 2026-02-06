import SwiftUI

struct ChatListView: View {
    @State private var conversations: [ChatService.ConversationItem] = []
    @State private var isLoading = true
    @State private var showNewChatSheet = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea()
                
                if isLoading {
                    ProgressView().tint(.cyan)
                } else if conversations.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "bubble.left.and.bubble.right")
                            .font(.system(size: 60))
                            .foregroundColor(.gray.opacity(0.5))
                        Text("No conversations yet")
                            .font(.title3)
                            .foregroundColor(.white)
                        Text("Start chatting with your contacts")
                            .foregroundColor(.gray)
                        
                        Button(action: { showNewChatSheet = true }) {
                            Text("Start Chat")
                                .fontWeight(.bold)
                                .foregroundColor(.black)
                                .padding()
                                .background(Color.cyan)
                                .cornerRadius(20)
                        }
                    }
                } else {
                    List {
                        ForEach(conversations) { chat in
                            NavigationLink(destination: ChatViewWrapper(friendId: chat.id)) {
                                ChatListRow(conversation: chat)
                            }
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                        }
                    }
                    .listStyle(.plain)
                    .refreshable {
                        await loadConversations()
                    }
                }
                
                // FAB for new chat
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button(action: { showNewChatSheet = true }) {
                            Image(systemName: "square.and.pencil")
                                .font(.title2)
                                .foregroundColor(.black)
                                .frame(width: 56, height: 56)
                                .background(Color.cyan)
                                .clipShape(Circle())
                                .shadow(radius: 4)
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Chats")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(Color(red: 0.04, green: 0.09, blue: 0.16), for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .onAppear {
                loadConversations()
            }
            .sheet(isPresented: $showNewChatSheet) {
                NewChatSheet()
            }
        }
    }
    
    private func loadConversations() {
        Task {
            do {
                let items = try await ChatService.shared.getRecentConversations()
                await MainActor.run {
                    conversations = items
                    isLoading = false
                }
            } catch {
                print("Failed to load chats: \(error)")
                await MainActor.run { isLoading = false }
            }
        }
    }
}

// Wrapper to find/create Friend object from ID before opening ChatView
struct ChatViewWrapper: View {
    let friendId: String
    @State private var friend: Friend?
    
    var body: some View {
        Group {
            if let friend = friend {
                ChatView(friend: friend)
            } else {
                ProgressView().tint(.cyan)
                    .task {
                        // Find friend object from service
                        let friends = try? await SocialService.shared.getFriends()
                        // Match either userId or friendId
                        if let match = friends?.first(where: { $0.friendId == friendId || $0.userId == friendId }) {
                            self.friend = match
                        }
                    }
            }
        }
    }
}

struct ChatListRow: View {
    let conversation: ChatService.ConversationItem
    
    var body: some View {
        HStack(spacing: 12) {
            // Avatar
            ZStack {
                Circle()
                    .fill(LinearGradient(colors: [.cyan, .blue], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 50, height: 50)
                
                Text(String(conversation.friendName?.prefix(1) ?? "?"))
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(conversation.friendName ?? "Unknown")
                        .font(.headline)
                        .foregroundColor(.white)
                    Spacer()
                    Text(formatDate(conversation.lastMessageTime))
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                HStack {
                    Text(conversation.lastMessage)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                        .lineLimit(1)
                    
                    Spacer()
                    
                    if conversation.unreadCount > 0 {
                        Text("\(conversation.unreadCount)")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.black)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.cyan)
                            .clipShape(Capsule())
                    }
                }
            }
        }
        .padding(.vertical, 6)
        .contentShape(Rectangle()) // Make full row tappable
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        if Calendar.current.isDateInToday(date) {
            formatter.dateFormat = "HH:mm"
        } else {
            formatter.dateFormat = "MMM d"
        }
        return formatter.string(from: date)
    }
}

struct NewChatSheet: View {
    @Environment(\.dismiss) var dismiss
    @State private var contacts: [Friend] = []
    
    var body: some View {
        NavigationStack {
            List(contacts) { contact in
                NavigationLink(destination: ChatView(friend: contact)) {
                    FriendChatRow(friend: contact)
                }
            }
            .navigationTitle("New Message")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .task {
                contacts = (try? await SocialService.shared.getFriends().filter { $0.status == .accepted }) ?? []
            }
        }
    }
}
