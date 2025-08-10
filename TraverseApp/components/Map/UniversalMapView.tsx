import React from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { BusLocation } from '../../services/traccarService';

interface UniversalMapViewProps {
  buses: BusLocation[];
  selectedBus?: BusLocation | null;
  onBusSelect?: (bus: BusLocation) => void;
}

const UniversalMapView: React.FC<UniversalMapViewProps> = ({ buses, selectedBus, onBusSelect }) => {
  // Create HTML content for the map
  const generateMapHTML = () => {
    const busesJson = JSON.stringify(buses.map(bus => ({
      id: bus.id,
      lat: bus.latitude,
      lng: bus.longitude,
      route: bus.routeNumber,
      plate: bus.busInfo.plateNumber,
      speed: bus.speed,
      status: bus.status,
      driver: bus.driver?.name || 'Unknown',
      lastUpdate: bus.lastUpdate.toLocaleTimeString()
    })));

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
        .status-active { background-color: #4CAF50; }
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
        <div class="legend-item"><div class="legend-dot status-active"></div>Active</div>
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
        
        // Add bus markers
        const markers = [];
        buses.forEach(bus => {
            const statusClass = 'status-' + bus.status;
            
            const icon = L.divIcon({
                html: \`<div class="bus-marker \${statusClass}">\${bus.route}</div>\`,
                className: 'custom-div-icon',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            const marker = L.marker([bus.lat, bus.lng], { icon: icon })
                .bindPopup(\`
                    <div style="min-width: 200px;">
                        <h3 style="margin: 0 0 10px 0; color: #1976d2;">🚌 \${bus.plate}</h3>
                        <div style="font-size: 14px; line-height: 1.5;">
                            <div><strong>Route:</strong> \${bus.route}</div>
                            <div><strong>Speed:</strong> \${bus.speed.toFixed(1)} km/h</div>
                            <div><strong>Status:</strong> <span style="color: \${getStatusColor(bus.status)}; font-weight: bold;">\${bus.status.toUpperCase()}</span></div>
                            <div><strong>Driver:</strong> \${bus.driver}</div>
                            <div><strong>Last Update:</strong> \${bus.lastUpdate}</div>
                            <div style="margin-top: 5px; font-size: 12px; color: #666;">
                                📍 \${bus.lat.toFixed(6)}, \${bus.lng.toFixed(6)}
                            </div>
                        </div>
                    </div>
                \`)
                .addTo(map);
            
            markers.push(marker);
        });
        
        // Fit map to show all buses
        if (buses.length > 0) {
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
        
        function getStatusColor(status) {
            switch(status) {
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

  if (Platform.OS === 'web') {
    // For web, render the WebMapView component directly
    const WebMapView = require('./WebMapView').default;
    return <WebMapView buses={buses} selectedBus={selectedBus} onBusSelect={onBusSelect} />;
  }

  // For mobile, use WebView with the same Leaflet map
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
      />
    </View>
  );
};

export default UniversalMapView;
