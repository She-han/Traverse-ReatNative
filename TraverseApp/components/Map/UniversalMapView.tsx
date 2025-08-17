import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { BusLocation } from '../../services/traccarService';

interface UniversalMapViewProps {
  buses: BusLocation[];
  selectedBus?: BusLocation | null;
  onBusSelect?: (bus: BusLocation) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const UniversalMapView: React.FC<UniversalMapViewProps> = ({ buses, selectedBus, onBusSelect, userLocation }) => {
  // Create optimized mobile HTML content for the map
  const generateMapHTML = () => {
    const busesJson = JSON.stringify(buses.map(bus => ({
      id: bus.id,
      lat: bus.latitude,
      lng: bus.longitude,
      routeNumber: bus.routeNumber,
      routeName: bus.routeInfo?.routeName || `Route ${bus.routeNumber}`,
      routeDetails: bus.routeInfo ? `${bus.routeInfo.startLocation} → ${bus.routeInfo.endLocation}` : '',
      plate: bus.busInfo.plateNumber,
      speed: bus.speed,
      status: 'online', // Set all buses with location data as online
      driver: bus.driver?.name || 'Unknown',
      lastUpdate: bus.lastUpdate.toLocaleTimeString()
    })));

    const userLocationJson = userLocation ? JSON.stringify({
      lat: userLocation.latitude,
      lng: userLocation.longitude
    }) : 'null';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .bus-marker {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: white;
            font-weight: bold;
        }
        .status-online { background-color: #4CAF50; }
        .status-inactive { background-color: #FF9800; }
        .status-maintenance { background-color: #F44336; }
        .status-offline { background-color: #9E9E9E; }
        
        .legend {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.9);
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 1000;
        }
        .legend-title { font-weight: bold; margin-bottom: 5px; }
        .legend-item { display: flex; align-items: center; margin: 2px 0; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
        
        .live-indicator {
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            font-weight: bold;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    
    <div class="legend">
        <div class="legend-title">Bus Status</div>
        <div class="legend-item"><div class="legend-dot status-online"></div>Online</div>
        <div class="legend-item"><div class="legend-dot status-inactive"></div>Inactive</div>
        <div class="legend-item"><div class="legend-dot status-maintenance"></div>Maintenance</div>
        <div class="legend-item"><div class="legend-dot status-offline"></div>Offline</div>
    </div>
    
    <div class="live-indicator">
        🔴 LIVE • ${buses.length} buses tracked
    </div>

    <script>
        // Initialize map
        const map = L.map('map').setView([6.9271, 79.8612], 13);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Bus data
        const buses = ${busesJson};
        const userLocation = ${userLocationJson};
        
        // Add bus markers
        const markers = [];
        buses.forEach(bus => {
            const statusClass = 'status-' + bus.status;
            
            const icon = L.divIcon({
                html: \`<div class="bus-marker \${statusClass}">\${bus.routeNumber}</div>\`,
                className: 'custom-div-icon',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            const marker = L.marker([bus.lat, bus.lng], { icon: icon })
                .bindPopup(\`
                    <div style="min-width: 200px;">
                        <h3 style="margin: 0 0 10px 0; color: #1976d2;">🚌 \${bus.plate}</h3>
                        <div style="font-size: 14px; line-height: 1.5;">
                            <div><strong>Route:</strong> \${bus.routeName}</div>
                            \${bus.routeDetails ? \`<div style="color: #666; margin-bottom: 5px;">\${bus.routeDetails}</div>\` : ''}
                            <div><strong>Speed:</strong> \${bus.speed.toFixed(1)} km/h</div>
                            <div><strong>Status:</strong> <span style="color: \${getStatusColor(bus.status)}; font-weight: bold;">\${bus.status.toUpperCase()}</span></div>
                            <div><strong>Driver:</strong> \${bus.driver}</div>
                            <div><strong>Last Update:</strong> \${bus.lastUpdate}</div>
                        </div>
                    </div>
                \`)
                .addTo(map);
            
            markers.push(marker);
        });
        
        // Add user location marker if available
        if (userLocation) {
            const userIcon = L.divIcon({
                html: '<div style="width: 20px; height: 20px; border-radius: 50%; background-color: #6366f1; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px; color: white;">📍</div>',
                className: 'user-location-icon',
                iconSize: [26, 26],
                iconAnchor: [13, 13]
            });
            
            const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
                .bindPopup(\`
                    <div style="min-width: 150px;">
                        <h3 style="margin: 0 0 10px 0; color: #6366f1;">📍 Your Location</h3>
                        <div style="font-size: 14px; line-height: 1.5;">
                            <div>You are currently here</div>
                        </div>
                    </div>
                \`)
                .addTo(map);
            
            markers.push(userMarker);
            
            // Center map on user location if available
            map.setView([userLocation.lat, userLocation.lng], 14);
        }
        
        // Fit map to show all markers (buses + user location)
        if (markers.length > 0) {
            const group = new L.featureGroup(markers);
            const bounds = group.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds.pad(0.1));
            }
        }
        
        function getStatusColor(status) {
            switch(status) {
                case 'online':
                case 'active': return '#4CAF50';
                case 'inactive': return '#FF9800';
                case 'maintenance': return '#F44336';
                default: return '#9E9E9E';
            }
        }
    </script>
</body>
</html>`;
  };

  // Mobile-optimized map using WebView
  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ html: generateMapHTML() }}
        style={{ flex: 1 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        allowsFullscreenVideo={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
      />
    </View>
  );
};

export default UniversalMapView;
