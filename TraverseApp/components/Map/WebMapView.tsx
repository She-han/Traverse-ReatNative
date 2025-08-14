import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BusLocation } from '../../services/traccarService';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom bus icon
const createBusIcon = (status: string) => {
  const color = status === 'active' ? '#4CAF50' : 
                status === 'inactive' ? '#FF9800' : 
                status === 'maintenance' ? '#F44336' : '#9E9E9E';
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: white;
        font-weight: bold;
      ">🚌</div>
    `,
    className: 'bus-marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

// Custom user location icon
const createUserLocationIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        background-color: #6366f1;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        font-weight: bold;
      ">📍</div>
    `,
    className: 'user-location-marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

// Component to update map center when buses change
const MapUpdater: React.FC<{ buses: BusLocation[]; userLocation?: { latitude: number; longitude: number } | null }> = ({ buses, userLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    if (userLocation) {
      // Center on user location if available
      map.setView([userLocation.latitude, userLocation.longitude], 14);
      console.log('🗺️ WebMap centered on user location:', userLocation);
    } else if (buses.length > 0) {
      // Calculate bounds to fit all buses
      const bounds = L.latLngBounds(buses.map(bus => [bus.latitude, bus.longitude]));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [buses, userLocation, map]);
  
  return null;
};

interface WebMapViewProps {
  buses: BusLocation[];
  selectedBus?: BusLocation | null;
  onBusSelect?: (bus: BusLocation) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const WebMapView: React.FC<WebMapViewProps> = ({ buses, selectedBus, onBusSelect, userLocation }) => {
  const mapRef = useRef<L.Map | null>(null);
  
  // Default center (Colombo, Sri Lanka)
  const defaultCenter: [number, number] = [6.9271, 79.8612];
  
  // Calculate center based on buses or use default
  const mapCenter = buses.length > 0 
    ? [buses[0].latitude, buses[0].longitude] as [number, number]
    : defaultCenter;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater buses={buses} userLocation={userLocation} />
        
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={createUserLocationIcon()}
          >
            <Popup>
              <div style={{ minWidth: '150px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#6366f1' }}>
                  📍 Your Location
                </h3>
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                  <div><strong>Latitude:</strong> {userLocation.latitude.toFixed(6)}</div>
                  <div><strong>Longitude:</strong> {userLocation.longitude.toFixed(6)}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        
        {buses.map((bus) => (
          <Marker
            key={bus.id}
            position={[bus.latitude, bus.longitude]}
            icon={createBusIcon(bus.status)}
            eventHandlers={{
              click: () => onBusSelect?.(bus),
            }}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
                  🚌 {bus.busInfo.plateNumber}
                </h3>
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                  <div><strong>Route:</strong> {bus.routeNumber}</div>
                  <div><strong>Speed:</strong> {bus.speed.toFixed(1)} km/h</div>
                  <div><strong>Status:</strong> 
                    <span style={{ 
                      color: bus.status === 'active' ? '#4CAF50' : 
                             bus.status === 'inactive' ? '#FF9800' : 
                             bus.status === 'maintenance' ? '#F44336' : '#9E9E9E',
                      fontWeight: 'bold',
                      marginLeft: '5px'
                    }}>
                      {bus.status.toUpperCase()}
                    </span>
                  </div>
                  <div><strong>Last Update:</strong> {bus.lastUpdate.toLocaleTimeString()}</div>
                  {bus.driver && (
                    <>
                      <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '5px' }}>
                        <strong>Driver:</strong> {bus.driver.name}
                      </div>
                      {bus.driver.phone && (
                        <div><strong>Phone:</strong> {bus.driver.phone}</div>
                      )}
                    </>
                  )}
                  <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                    📍 {bus.latitude.toFixed(6)}, {bus.longitude.toFixed(6)}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map Legend */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'white',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Bus Status</div>
        <div><span style={{ color: '#4CAF50' }}>●</span> Active</div>
        <div><span style={{ color: '#FF9800' }}>●</span> Inactive</div>
        <div><span style={{ color: '#F44336' }}>●</span> Maintenance</div>
        <div><span style={{ color: '#9E9E9E' }}>●</span> Offline</div>
      </div>
      
      {/* Real-time indicator */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(76, 175, 80, 0.9)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '15px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 1000
      }}>
        🔴 LIVE • {buses.length} buses tracked
      </div>
    </div>
  );
};

export default WebMapView;
