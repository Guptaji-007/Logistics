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
  const socketRef = useRef();
  const { data: session } = useSession();
  const [acceptDisabled, setAcceptDisabled] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);


  useEffect(() => {
    if (!driverLocation) return;

    fetch(`http://localhost:4000/api/ride-request/nearby?lat=${driverLocation.latitude}&lon=${driverLocation.longitude}`)
      .then(res => res.json())
      .then(data => {
        const formattedRequests = data.map(req => ({
          requestId: req.id,
          userId: req.userId,
          pickup: req.pickup,
          dropoff: req.dropoff,
          pickupLat: req.pickupLat,
          pickupLon: req.pickupLon,
          dropoffLat: req.dropoffLat,
          dropoffLon: req.dropoffLon,
          offerPrice: req.offerPrice,
          // Check if there are responses from this driver
          // This requires the API to return 'responses' or logic to filter them
          // For now, we assume the API returns raw requests
        }));

        setRequests(prev => {
          const newReqs = formattedRequests.filter(
            nr => !prev.some(pr => pr.requestId === nr.requestId)
          );
          return [...prev, ...newReqs];
        });
      });
  }, [driverLocation]);


  // 1. Fetch Location
  useEffect(() => {
    if (!session?.user?.email) return;

    fetch(`/api/fetch-location?driver_email=${encodeURIComponent(session.user.email)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.location) {
          setDriverLocation(data.location);
        } else if (navigator.geolocation) {
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
      })
      .catch(err => console.error("Error fetching location API:", err));
  }, [session]);

  // 2. Connect Socket
  useEffect(() => {
    if (!session?.user?.email || !driverLocation) return;

    socketRef.current = io('http://localhost:4000');

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

    // FIX: Update request when User Counters Back
    socketRef.current.on('user_counter_response', (data) => {
      setRequests((prev) => prev.map(req =>
        // Use requestId for secure matching if available, else fallback
        (req.requestId && req.requestId === data.requestId) || 
        (!req.requestId && req.userId === data.userId && req.pickup === data.pickup)
          ? { ...req, ...data, counterPrice: data.counterPrice, status: 'user_countered' }
          : req
      ));
    });

    socketRef.current.on('ride_confirmed', (ride) => {
      setRequests((prev) => prev.filter(req =>
        req.requestId !== ride.requestId // Remove the confirmed request
      ));
      if (ride.driverId === session?.user?.email) {
        setActiveJob(ride);
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [session, driverLocation]);

  const handleAccept = (request) => {
    setAcceptDisabled(true);
    // Optimistic remove or disable
    
    socketRef.current.emit('driver_response', {
      requestId: request.requestId,
      userId: request.userId,
      driverId: session?.user?.email,
      status: 'accepted',
      offerPrice: request.offerPrice
    });
    
    setTimeout(() => setAcceptDisabled(false), 5000);
  };

  const handleCounter = (request) => {
    const counterPrice = prompt('Enter your counter offer price:');
    if (counterPrice) {
      const price = parseFloat(counterPrice);
      
      // 1. Emit to server
      socketRef.current.emit('driver_counter_response', {
        ...request,
        driverId: session?.user?.email,
        status: 'countered',
        offerPrice: request.offerPrice,
        counterPrice: price,
      });

      // 2. FIX: Immediately update local state so driver sees their own counter
      setRequests(prev => prev.map(r => 
        r.requestId === request.requestId 
          ? { ...r, counterPrice: price, status: 'countered' }
          : r
      ));
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
            <span className={`text-xs ${driverLocation ? 'text-green-500' : 'text-red-500'}`}>
              {driverLocation ? 'Online' : 'Getting Location...'}
            </span>
          </div>
          {requests.length === 0 && <p className="text-gray-500 text-center py-4">Waiting for rides...</p>}
          {requests.map((req, idx) => (
            <div key={req.requestId || idx} className="border-t first:border-t-0 pt-4 mt-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium">{req.pickup}</p>
                  <p className="text-sm text-gray-500">To: {req.dropoff}</p>
                  
                  {/* FIX: Improved Price Display */}
                  <div className="mt-1">
                    <span className="text-sm text-gray-600">User Offer: ₹{req.offerPrice}</span>
                    {req.counterPrice && (
                         <span className="block text-sm font-semibold text-blue-600">
                             {req.status === 'user_countered' ? 'User Counter: ' : 'Your Counter: '} 
                             ₹{req.counterPrice}
                         </span>
                    )}
                  </div>
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