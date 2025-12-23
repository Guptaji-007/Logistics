import { MapContainer, TileLayer, useMap, Marker } from 'react-leaflet';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';

// --- FIX: Import Leaflet CSS (Crucial for tiles) ---
import 'leaflet/dist/leaflet.css'; 

// Fix Leaflet marker icon paths
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src || markerIcon2x,
  iconUrl: markerIcon.src || markerIcon,
  shadowUrl: markerShadow.src || markerShadow,
});

const RoutingControl = ({ pickup, destination }) => {
  const map = useMap();
  const routingRef = useRef(null);

  useEffect(() => {
    // Validations to prevent crashes
    if (!pickup || !destination || !map) return;
    if (isNaN(pickup.lat) || isNaN(pickup.lon) || isNaN(destination.lat) || isNaN(destination.lon)) return;

    // Cleanup previous control
    if (routingRef.current) {
      try {
        map.removeControl(routingRef.current);
      } catch (err) {}
    }

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(pickup.lat, pickup.lon),
        L.latLng(destination.lat, destination.lon),
      ],
      routeWhileDragging: false,
      show: false, // Hides the text instructions
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#2563eb', weight: 5 }] // Blue route line
      }
    });

    // Suppress routing errors
    routingControl.on('routingerror', (e) => {
        console.warn("Routing ignored:", e.error?.message);
    });

    routingControl.addTo(map);
    routingRef.current = routingControl;

    return () => {
      if (routingRef.current && map) {
        try { map.removeControl(routingRef.current); } catch (e) {}
      }
    };
  }, [pickup, destination, map]);

  return null;
};

// Driver Icon
const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048315.png', 
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const MapView = ({ pickup, destination, driverLocation }) => {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (driverLocation && !isNaN(driverLocation.lat)) {
      setPosition([driverLocation.lat, driverLocation.lon]);
    }
  }, [driverLocation]);

  const isValid = (loc) => loc && loc.lat != null && loc.lon != null && !isNaN(loc.lat);

  // Render a placeholder if data is missing
  if (!isValid(pickup) || !isValid(destination)) {
      return (
        <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
            Waiting for coordinates...
        </div>
      );
  }

  return (
    <MapContainer
      center={[pickup.lat, pickup.lon]}
      zoom={13}
      style={{ height: "100%", width: "100%", zIndex: 0 }} // zIndex fixes potential overlay issues
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RoutingControl pickup={pickup} destination={destination} />

      {position && (
       <Marker position={position} icon={driverIcon} />
      )}
    </MapContainer>
  );
};

export default MapView;