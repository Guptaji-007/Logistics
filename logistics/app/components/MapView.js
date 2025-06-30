import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';

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
    if (!pickup || !destination) return;

    // Remove previous routing control if exists
    if (routingRef.current) {
      try {
        map.removeControl(routingRef.current);
      } catch {}
    }

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(pickup.lat, pickup.lon),
        L.latLng(destination.lat, destination.lon),
      ],
      routeWhileDragging: false,
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
    }).addTo(map);

    routingRef.current = routingControl;

    return () => {
      if (routingRef.current) {
        try {
          map.removeControl(routingRef.current);
        } catch {}
        routingRef.current = null;
      }
    };
  }, [pickup, destination, map]);

  return null;
};

const MapView = ({ pickup, destination }) => {
  return (
    <MapContainer
      center={[pickup.lat, pickup.lon]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RoutingControl pickup={pickup} destination={destination} />
    </MapContainer>
  );
};

export default MapView;
