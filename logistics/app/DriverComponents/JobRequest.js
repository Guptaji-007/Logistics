'use client';
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import ActiveJob from './ActiveJob';
import MapView from '../components/MapView';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

const JobRequests = () => {
  const [requests, setRequests] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const socketRef = useRef();
  const { data: session } = useSession();
  const [acceptDisabled, setAcceptDisabled] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);

  // 1. Fetch Location (DB or Live Fallback)
  useEffect(() => {
    if (!session?.user?.email) return;

    fetch(`/api/fetch-location?driver_email=${encodeURIComponent(session.user.email)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.location) {
          console.log("Driver location fetched from DB:", data.location);
          setDriverLocation(data.location);
        } else {
           // Fallback: If no location in DB, try to get it from browser
           console.log("No location in DB, trying browser geolocation...");
           if (navigator.geolocation) {
             navigator.geolocation.getCurrentPosition(
               (pos) => {
                 setDriverLocation({
                   latitude: pos.coords.latitude,
                   longitude: pos.coords.longitude
                 });
               },
               (err) => console.error("Error getting live location fallback:", err)
             );
           }
        }
      })
      .catch(err => console.error("Error fetching location API:", err));
  }, [session]);

  // 2. Connect Socket (Depends on session AND driverLocation)
  useEffect(() => {
    // We need both email and location to register as a driver
    if (!session?.user?.email || !driverLocation) return;

    // socketRef.current = io('https://logistics-hs8g.vercel.app');
    socketRef.current = io('http://localhost:4000');

    // Register with the backend
    socketRef.current.emit('register', { 
      type: 'driver', 
      id: session.user.email, 
      lat: driverLocation.latitude,
      lon: driverLocation.longitude
    });

    socketRef.current.on('new_ride_request', (data) => {
      console.log("New ride request received:", data);
      setRequests((prev) => [...prev, data]);
    });

    socketRef.current.on('user_counter_response', (data) => {
      setRequests((prev) => prev.map(req =>
        req.userId === data.userId && req.pickup === data.pickup && req.dropoff === data.dropoff
          ? { ...req, ...data }
          : req
      ));
    });

    socketRef.current.on('ride_confirmed', (ride) => {
      setRequests((prev) => prev.filter(req =>
        !(req.pickup === ride.pickup && req.dropoff === ride.dropoff && req.userId === ride.userId)
      ));
      if (ride.driverId === session?.user?.email) {
        setActiveJob(ride);
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [session, driverLocation]); // <--- KEY FIX: Added driverLocation dependency

  const handleAccept = (request) => {
    console.log('Accepting request:', request);
    setAcceptDisabled(true);
    setTimeout(() => {
      setAcceptDisabled(false);
    }, 10000);
    socketRef.current.emit('driver_response', {
      ...request,
      driverId: session?.user?.email,
      status: 'accepted',
    });
  };

  const handleCounter = (request) => {
    const counterPrice = prompt('Enter your counter offer price:');
    if (counterPrice) {
      socketRef.current.emit('driver_counter_response', {
        ...request,
        driverId: session?.user?.email,
        status: 'countered',
        offerPrice: request.offerPrice,
        counterPrice: parseFloat(counterPrice),
      });
    }
  };

  const handleFinish = () => {
    setActiveJob(null);
  };

  return (
    <div>
      {activeJob ? (
        <ActiveJob job={activeJob} onFinish={handleFinish} />
      ) : (
        <div className="bg-white p-4 rounded-2xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">New Job Requests</h3>
            {/* Debug Info (Optional - remove in production) */}
            <span className={`text-xs ${driverLocation ? 'text-green-500' : 'text-red-500'}`}>
               {driverLocation ? 'Online' : 'Getting Location...'}
            </span>
          </div>
          {requests.length === 0 && <p className="text-gray-500 text-center py-4">Waiting for rides...</p>}
          {requests.map((req, idx) => (
            <div key={idx} className="border-t first:border-t-0 pt-4 mt-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium">{req.pickup}</p>
                  <p className="text-sm text-gray-500">To: {req.dropoff}</p>
                  <p className="text-sm font-semibold text-blue-600">
                    {req.counterPrice
                      ? `Counter: ₹${req.counterPrice}`
                      : `Offer: ₹${req.offerPrice}`}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                    <button onClick={() => handleCounter(req)} className="bg-yellow-500 text-white px-4 py-1.5 rounded-lg text-sm">
                        Counter
                    </button>
                    <button
                        onClick={() => handleAccept(req)}
                        className={`bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm ${acceptDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={acceptDisabled}
                    >
                        Accept
                    </button>
                </div>
              </div>
              <div className="h-48 w-full rounded overflow-hidden relative z-0">
                <MapView
                  pickup={{ lat: req.pickupLat, lon: req.pickupLon, label: req.pickup }}
                  destination={{ lat: req.dropoffLat, lon: req.dropoffLon, label: req.dropoff }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobRequests;