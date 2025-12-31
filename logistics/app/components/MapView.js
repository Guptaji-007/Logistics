import { MapContainer, TileLayer, useMap, Marker } from 'react-leaflet';
import { useEffect, useRef } from 'react';
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

// Normalizes {lat, lon} or {latitude, longitude} to a stable object
const normalizeLocation = (loc) => {
  if (!loc) return null;
  const lat = loc.lat ?? loc.latitude;
  const lon = loc.lon ?? loc.longitude;
  if (lat == null || lon == null) return null;

  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return null;

  return { lat: latNum, lon: lonNum };
};

const RoutingControl = ({ start, destination }) => {
  const map = useMap();
  const routingRef = useRef(null);

  useEffect(() => {
    if (!start || !destination || !map) return;

    // Remove any previous control so a fresh route is always drawn
    if (routingRef.current) {
      try { map.removeControl(routingRef.current); } catch (e) {}
      routingRef.current = null;
    }

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(start.lat, start.lon),
        L.latLng(destination.lat, destination.lon),
      ],
      routeWhileDragging: false,
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#2563eb', weight: 5 }],
      },
    });

    routingControl.on('routingerror', (e) => {
      console.warn('Routing ignored:', e.error?.message);
    });

    routingControl.addTo(map);
    routingRef.current = routingControl;

    return () => {
      if (routingRef.current && map) {
        try { map.removeControl(routingRef.current); } catch (e) {}
      }
    };
  }, [start, destination, map]);

  return null;
};

// Keeps the viewport centered on the active start point (pickup or driver)
const RecenterMap = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !center) return;
    map.setView([center.lat, center.lon]);
  }, [map, center]);

  return null;
};

// Driver Icon
const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048315.png', 
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const MapView = ({ pickup, destination, driverLocation }) => {
  const normalizedPickup = normalizeLocation(pickup);
  const normalizedDestination = normalizeLocation(destination);
  const normalizedDriver = normalizeLocation(driverLocation);

  // If driver location is available (ride is live), route from driver to destination; otherwise pickup to destination
  const routeStart = normalizedDriver || normalizedPickup;
  const driverPosition = normalizedDriver ? [normalizedDriver.lat, normalizedDriver.lon] : null;

  if (!routeStart || !normalizedDestination) {
    return (
      <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
        Waiting for coordinates...
      </div>
    );
  }

  return (
    <MapContainer
      center={[routeStart.lat, routeStart.lon]}
      zoom={13}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <RecenterMap center={routeStart} />
      <RoutingControl start={routeStart} destination={normalizedDestination} />

      {driverPosition && <Marker position={driverPosition} icon={driverIcon} />}
    </MapContainer>
  );
};

export default MapView;