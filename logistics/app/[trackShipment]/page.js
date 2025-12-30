'use client';
import { useEffect, useState, useRef, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import { useSession } from 'next-auth/react';
import { Package, Truck, Phone, AlertCircle, CheckCircle, MapPin } from 'lucide-react';

const MapView = dynamic(() => import('../components/MapView'), { ssr: false });

export default function TrackShipment({ params }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // ID Extraction Logic
  let trackingId = searchParams.get('id');
  if (!trackingId && resolvedParams?.trackShipment && resolvedParams.trackShipment !== 'trackShipment') {
      trackingId = resolvedParams.trackShipment;
  }

  const [ride, setRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [status, setStatus] = useState('Loading...');
  const [isCompleted, setIsCompleted] = useState(false);
  const socketRef = useRef();

  // 1. Fetch Ride Details & Check Completion Status
  useEffect(() => {
    if (!trackingId) {
        setStatus("No Tracking ID provided");
        return;
    }

    const fetchRide = async () => {
      try {
        const res = await fetch(`/api/rides/trackShipment?trackingId=${trackingId}`); 
        const data = await res.json();
        
        if (data.ride) {
          setRide(data.ride);
          
          // Check if already completed
          if (data.ride.completed || data.ride.assignmentStatus === 'completed') {
             setIsCompleted(true);
             setStatus('Delivered');
          } else {
             setStatus(data.ride.status || 'In Transit');
          }

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

  // 2. Live Tracking Socket
  useEffect(() => {
    if (!trackingId || isCompleted) return;

    socketRef.current = io("https://logistics-bknd.onrender.com");

    socketRef.current.on('connect', () => {
      console.log("Connected to tracking socket");
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

    // === NEW: Listen for Completion ===
    socketRef.current.on('ride_status_update', ({ rideId, status }) => {
        if (rideId === trackingId && status === 'completed') {
            setIsCompleted(true);
            setStatus('Delivered');
            // Optional: Disconnect socket as tracking is done
            socketRef.current.disconnect();
        }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [trackingId, session, isCompleted]);

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
               <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                   isCompleted 
                   ? 'bg-green-600/20 text-green-400 border-green-600/50' 
                   : 'bg-blue-600/20 text-blue-400 border-blue-600/50'
               }`}>
                 {status}
               </span>
            </div>
          </div>

          <div className="space-y-6 relative">
             <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-700"></div>

             <div className="relative pl-10">
                <div className="absolute left-2.5 top-1.5 w-3 h-3 bg-blue-500 rounded-full ring-4 ring-gray-900"></div>
                <p className="text-gray-500 text-xs uppercase font-bold mb-1">Pickup</p>
                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <h2 className="text-sm font-semibold text-white">{ride.pickup}</h2>
                </div>
             </div>

             <div className="relative pl-10">
                <div className="absolute left-2.5 top-1.5 w-3 h-3 bg-red-500 rounded-full ring-4 ring-gray-900"></div>
                <p className="text-gray-500 text-xs uppercase font-bold mb-1">Dropoff</p>
                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <h2 className="text-sm font-semibold text-white">{ride.dropoff}</h2>
                </div>
             </div>
          </div>

          {/* DRIVER / STATUS BLOCK */}
          {isCompleted ? (
              <div className="mt-8 p-6 bg-green-900/20 border border-green-800 rounded-xl flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle className="text-green-500 w-6 h-6" />
                  </div>
                  <h3 className="text-green-400 font-bold text-lg">Delivered Successfully</h3>
                  <p className="text-green-200/60 text-sm mt-1">This ride has been completed.</p>
              </div>
          ) : (
             <>
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
             </>
          )}
        </div>

        {/* RIGHT PANEL - MAP */}
        <div className="w-full lg:w-[62%] h-[50vh] lg:h-[calc(100vh-65px)] relative">
            {/* If completed, we can still show the map with static points, or a summary view. Here we keep the map. */}
            <MapView
                pickup={{ lat: ride.pickupLat, lon: ride.pickupLon }}
                destination={{ lat: ride.dropoffLat, lon: ride.dropoffLon }}
                driverLocation={isCompleted ? null : driverLocation} // Hide driver marker if completed
            />
            
            {isCompleted && (
                <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center z-[500] pointer-events-none">
                     <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl shadow-2xl flex items-center gap-3">
                        <CheckCircle className="text-green-500" />
                        <span className="text-white font-bold">Ride Completed</span>
                     </div>
                </div>
            )}
        </div>
      </div>
    </>
  );
}