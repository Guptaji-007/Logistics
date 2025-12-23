'use client';
import { useEffect, useState, useRef, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import { useSession } from 'next-auth/react';
import { Package, Truck, Phone, AlertCircle } from 'lucide-react';

const MapView = dynamic(() => import('../components/MapView'), { ssr: false });

export default function TrackShipment({ params }) {
  // 1. Unwrap params (Next.js 15 Requirement)
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // 2. Robust ID Extraction
  // Priority: Query Param (?id=...) -> Path Param (/[id])
  // We ignore the path param if it equals the folder name "trackShipment"
  let trackingId = searchParams.get('id');
  if (!trackingId && resolvedParams?.trackShipment && resolvedParams.trackShipment !== 'trackShipment') {
      trackingId = resolvedParams.trackShipment;
  }

  const [ride, setRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [status, setStatus] = useState('Loading...');
  const socketRef = useRef();

  // 3. Fetch Ride Details
  useEffect(() => {
    if (!trackingId) {
        setStatus("No Tracking ID provided");
        return;
    }

    const fetchRide = async () => {
      try {
        // FIXED: Use 'trackingId' to match the API route expectation
        const res = await fetch(`/api/rides/trackShipment?trackingId=${trackingId}`); 
        const data = await res.json();
        
        if (data.ride) {
          setRide(data.ride);
          setStatus(data.ride.status || 'In Transit');
        } else {
            setStatus('Ride not found');
        }
      } catch (error) {
        console.error("Error fetching ride:", error);
        setStatus('Error loading data');
      }
    };

    fetchRide();
  }, [trackingId]);

  // 4. Live Tracking Socket
  useEffect(() => {
    if (!trackingId) return;

    // socketRef.current = io("https://logistics-hs8g.vercel.app");
    socketRef.current = io("http://localhost:4000");

    socketRef.current.on('connect', () => {
      console.log("Connected to tracking socket");
      // FIXED: Changed 'register1' to 'register' to match backend/sockets.js
      socketRef.current.emit('register', { 
        type: 'user', 
        id: session?.user?.email || 'GUEST_TRACKER', 
        rideId: trackingId 
      });
    });

    socketRef.current.on('driver_location', (data) => {
      if (data.rideId === trackingId) {
        setDriverLocation({ lat: data.lat, lon: data.lon });
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [trackingId, session]);

  if (!ride) return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">{status}</p>
        </div>
      </>
  );

  return (
    <>
      <Navbar />
      <div className="w-full h-0.5 bg-gray-700"></div>

      <div className="flex flex-col lg:flex-row min-h-screen bg-gray-900 text-gray-100 font-sans">
        {/* LEFT PANEL - DETAILS */}
        <div className="w-full lg:w-[38%] p-6 border-r border-gray-800 shadow-2xl z-10 bg-gray-900">
          <div className="mb-8">
            <h1 className="text-sm text-gray-400 uppercase tracking-wider mb-1">Tracking Number</h1>
            <span className="text-lime-400 font-mono text-2xl font-bold tracking-wide">{trackingId}</span>
            <div className="mt-4 flex items-center gap-2">
               <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded-full text-xs font-bold uppercase tracking-wide">
                 {status}
               </span>
            </div>
          </div>

          <div className="space-y-6 relative">
             {/* Connector Line */}
             <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-700"></div>

             {/* FROM */}
             <div className="relative pl-10">
                <div className="absolute left-2.5 top-1.5 w-3 h-3 bg-blue-500 rounded-full ring-4 ring-gray-900"></div>
                <p className="text-gray-500 text-xs uppercase font-bold mb-1">Pickup</p>
                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <h2 className="text-sm font-semibold text-white">{ride.pickup}</h2>
                </div>
             </div>

             {/* TO */}
             <div className="relative pl-10">
                <div className="absolute left-2.5 top-1.5 w-3 h-3 bg-red-500 rounded-full ring-4 ring-gray-900"></div>
                <p className="text-gray-500 text-xs uppercase font-bold mb-1">Dropoff</p>
                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <h2 className="text-sm font-semibold text-white">{ride.dropoff}</h2>
                </div>
             </div>
          </div>

          {/* Driver Status */}
          {driverLocation ? (
             <div className="mt-8 p-4 bg-green-900/20 border border-green-800 rounded-xl flex items-center gap-3 animate-pulse">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-400 text-sm font-medium">Driver is sharing live location</span>
             </div>
          ) : (
             <div className="mt-8 p-4 bg-gray-800/50 border border-gray-700 rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-gray-400 text-sm">Connecting to driver...</span>
             </div>
          )}
          
          {/* Driver Info Block (Optional) */}
          {ride.assignedDriver && (
              <div className="mt-6 flex items-center gap-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
                  <div className="bg-gray-700 p-3 rounded-full">
                      <Truck className="text-white w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-sm font-bold text-white">{ride.assignedDriver.fullName || "Driver Assigned"}</p>
                      <p className="text-xs text-gray-400">{ride.assignedDriver.vehicleNumber}</p>
                  </div>
              </div>
          )}
        </div>

        {/* RIGHT PANEL - MAP */}
        <div className="w-full lg:w-[62%] h-[50vh] lg:h-[calc(100vh-65px)] relative">
            <MapView
                pickup={{ lat: ride.pickupLat, lon: ride.pickupLon }}
                destination={{ lat: ride.dropoffLat, lon: ride.dropoffLon }}
                driverLocation={driverLocation}
            />
        </div>
      </div>
    </>
  );
}