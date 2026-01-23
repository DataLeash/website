import SwiftUI
import MapKit
import CoreLocation

// MARK: - WorldMapView
// Real-time access location tracking using MapKit

struct WorldMapView: View {
    @State private var locations: [MapLocation] = []
    @State private var stats = MapStats()
    @State private var isLoading = true
    @State private var selectedLocation: MapLocation?
    @State private var cameraPosition: MapCameraPosition = .automatic
    @State private var showLocationDetail = false
    
    var body: some View {
        ZStack {
            // Background
            Color(red: 0.04, green: 0.09, blue: 0.16)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                headerView
                
                // Stats Bar
                statsBar
                
                // Map
                if isLoading {
                    loadingView
                } else if locations.isEmpty {
                    emptyStateView
                } else {
                    mapView
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadLocations()
        }
        .refreshable {
            await loadLocations()
        }
        .sheet(isPresented: $showLocationDetail) {
            if let location = selectedLocation {
                LocationDetailSheet(location: location)
            }
        }
    }
    
    // MARK: - Header
    private var headerView: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [.cyan, .blue], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 44, height: 44)
                    Image(systemName: "globe.americas.fill")
                        .font(.system(size: 22))
                        .foregroundColor(.white)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Command Center")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    Text("Real-time access monitoring")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                Button(action: { Task { await loadLocations() } }) {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 18))
                        .foregroundColor(.cyan)
                        .padding(10)
                        .background(Color.cyan.opacity(0.2))
                        .cornerRadius(10)
                }
            }
        }
        .padding()
        .background(Color.black.opacity(0.3))
    }
    
    // MARK: - Stats Bar
    private var statsBar: some View {
        HStack(spacing: 12) {
            StatPill(icon: "globe", value: "\(stats.totalCountries)", label: "Countries", color: .cyan)
            StatPill(icon: "mappin.circle.fill", value: "\(stats.totalLocations)", label: "Locations", color: .blue)
            StatPill(icon: "eye.fill", value: "\(stats.activeViewers)", label: "Active", color: .green)
            StatPill(icon: "shield.slash.fill", value: "\(stats.blockedAttempts)", label: "Blocked", color: .red)
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
        .background(Color.black.opacity(0.2))
    }
    
    // MARK: - Map View
    private var mapView: some View {
        Map(position: $cameraPosition) {
            ForEach(locations) { location in
                Annotation(location.city, coordinate: CLLocationCoordinate2D(latitude: location.lat, longitude: location.lon)) {
                    MapPinView(location: location) {
                        selectedLocation = location
                        showLocationDetail = true
                    }
                }
            }
        }
        .mapStyle(.imagery(elevation: .realistic))
        .mapControls {
            MapCompass()
            MapScaleView()
        }
    }
    
    // MARK: - Loading View
    private var loadingView: some View {
        VStack(spacing: 16) {
            Spacer()
            ProgressView()
                .scaleEffect(1.5)
                .tint(.cyan)
            Text("Loading access locations...")
                .foregroundColor(.gray)
            Spacer()
        }
    }
    
    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Spacer()
            Image(systemName: "globe")
                .font(.system(size: 64))
                .foregroundColor(.gray.opacity(0.5))
            
            Text("No Access Data Yet")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text("Access locations will appear here\nwhen viewers open your files")
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
            Spacer()
        }
    }
    
    // MARK: - Load Data
    private func loadLocations() async {
        isLoading = true
        do {
            let result = try await SupabaseClient.shared.getAccessLocations()
            await MainActor.run {
                locations = result.locations
                stats = result.stats
                isLoading = false
                
                // Auto-focus map if we have locations
                if let first = locations.first {
                    cameraPosition = .region(MKCoordinateRegion(
                        center: CLLocationCoordinate2D(latitude: first.lat, longitude: first.lon),
                        span: MKCoordinateSpan(latitudeDelta: 50, longitudeDelta: 50)
                    ))
                }
            }
        } catch {
            await MainActor.run {
                isLoading = false
            }
        }
    }
}

// MARK: - Stat Pill
struct StatPill: View {
    let icon: String
    let value: String
    let label: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 12))
                    .foregroundColor(color)
                Text(value)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }
            Text(label)
                .font(.caption2)
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(color.opacity(0.15))
        .cornerRadius(10)
    }
}

// MARK: - Map Pin View
struct MapPinView: View {
    let location: MapLocation
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            ZStack {
                // Pulse animation for active
                if location.isActive {
                    Circle()
                        .fill(Color.green.opacity(0.3))
                        .frame(width: 40, height: 40)
                        .scaleEffect(1.0)
                        .animation(
                            .easeInOut(duration: 1.0).repeatForever(autoreverses: true),
                            value: location.isActive
                        )
                }
                
                // Main pin
                Circle()
                    .fill(location.statusColor)
                    .frame(width: 24, height: 24)
                    .overlay(
                        Circle()
                            .stroke(Color.white, lineWidth: 2)
                    )
                    .shadow(color: location.statusColor.opacity(0.5), radius: 4)
                
                // Count badge
                if location.viewerCount > 1 {
                    Text("\(location.viewerCount)")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white)
                        .padding(4)
                        .background(Color.blue)
                        .clipShape(Circle())
                        .offset(x: 12, y: -12)
                }
            }
        }
    }
}

// MARK: - Location Detail Sheet
struct LocationDetailSheet: View {
    let location: MapLocation
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.05, green: 0.08, blue: 0.15)
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 20) {
                        // Location Header
                        VStack(spacing: 8) {
                            ZStack {
                                Circle()
                                    .fill(location.statusColor.opacity(0.2))
                                    .frame(width: 80, height: 80)
                                Image(systemName: location.isBlocked ? "xmark.shield.fill" : location.isActive ? "antenna.radiowaves.left.and.right" : "mappin.circle.fill")
                                    .font(.system(size: 36))
                                    .foregroundColor(location.statusColor)
                            }
                            
                            Text(location.city)
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            
                            Text(location.country)
                                .font(.subheadline)
                                .foregroundColor(.gray)
                            
                            // Status Badge
                            HStack(spacing: 6) {
                                Circle()
                                    .fill(location.statusColor)
                                    .frame(width: 8, height: 8)
                                Text(location.isBlocked ? "Blocked" : location.isActive ? "Active Now" : "Historical")
                                    .font(.caption)
                                    .foregroundColor(location.statusColor)
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(location.statusColor.opacity(0.2))
                            .cornerRadius(20)
                        }
                        .padding(.top, 20)
                        
                        // Info Cards
                        VStack(spacing: 12) {
                            InfoRow(icon: "person.fill", label: "Viewer", value: location.viewerName ?? location.viewerEmail ?? "Anonymous")
                            InfoRow(icon: "eye.fill", label: "Access Count", value: "\(location.viewerCount) times")
                            InfoRow(icon: "clock.fill", label: "Last Access", value: formatDate(location.lastAccess))
                            InfoRow(icon: "globe", label: "Coordinates", value: String(format: "%.4f, %.4f", location.lat, location.lon))
                            
                            if let device = location.deviceType {
                                InfoRow(icon: "desktopcomputer", label: "Device", value: device.capitalized)
                            }
                            
                            if let browser = location.browser {
                                InfoRow(icon: "safari", label: "Browser", value: browser)
                            }
                        }
                        .padding()
                        .background(Color.white.opacity(0.05))
                        .cornerRadius(16)
                        .padding(.horizontal)
                        
                        // Files Accessed
                        if !location.files.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Files Accessed")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                
                                ForEach(location.files, id: \.self) { file in
                                    HStack {
                                        Image(systemName: "doc.fill")
                                            .foregroundColor(.cyan)
                                        Text(file)
                                            .foregroundColor(.white)
                                            .lineLimit(1)
                                        Spacer()
                                    }
                                    .padding()
                                    .background(Color.white.opacity(0.05))
                                    .cornerRadius(10)
                                }
                            }
                            .padding(.horizontal)
                        }
                        
                        // Open in Maps Button
                        Button(action: openInMaps) {
                            HStack {
                                Image(systemName: "map.fill")
                                Text("Open in Maps")
                            }
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(
                                LinearGradient(colors: [.cyan, .blue], startPoint: .leading, endPoint: .trailing)
                            )
                            .cornerRadius(12)
                        }
                        .padding(.horizontal)
                        .padding(.bottom, 30)
                    }
                }
            }
            .navigationTitle("Location Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundColor(.cyan)
                }
            }
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }
    
    private func openInMaps() {
        let url = URL(string: "http://maps.apple.com/?ll=\(location.lat),\(location.lon)&z=12")!
        UIApplication.shared.open(url)
    }
}

// MARK: - Info Row
struct InfoRow: View {
    let icon: String
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(.cyan)
                .frame(width: 24)
            
            Text(label)
                .font(.subheadline)
                .foregroundColor(.gray)
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .foregroundColor(.white)
        }
    }
}

#Preview {
    NavigationView {
        WorldMapView()
    }
}
