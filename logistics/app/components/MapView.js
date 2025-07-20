import { MapContainer, TileLayer, useMap,Marker } from 'react-leaflet';
import { useEffect, useRef,useState } from 'react';
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
    if (!pickup || !destination || !map) return;

    if (routingRef.current && routingRef.current._container && map) {
      try {
        map.removeControl(routingRef.current);
      } catch (err) {
        console.warn("Error removing routing control:", err);
      }
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
    if (
      routingRef.current &&
      routingRef.current._container &&
      map.hasLayer(routingRef.current)
    ) {
      try {
        map.removeControl(routingRef.current);
      } catch (err) {
        console.warn("Cleanup error in RoutingControl:", err);
      }
    }
    routingRef.current = null;
  };
}, [pickup, destination, map]);

  return null;
};


const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048315.png', // you can use a custom image
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});




const MapView = ({ pickup, destination , driverLocation}) => {
  
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (driverLocation) {
      setPosition([driverLocation.lat, driverLocation.lon]);
    }
  }, [driverLocation]);

  if (!pickup || !destination) return null;

  if (
  !pickup ||
  !destination ||
  pickup.lat == null ||
  pickup.lon == null ||
  destination.lat == null ||
  destination.lon == null
) return null;

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

      {position && (
       <Marker position={position} icon={driverIcon} />
      )}
    </MapContainer>
  );
};

export default MapView;


