'use client';
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import ActiveJob from './ActiveJob';
import MapView from '../components/MapView';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { set } from 'react-hook-form';


const JobRequests = () => {
  const [requests, setRequests] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const socketRef = useRef();
  const { data: session } = useSession();
  const [acceptDisabled,setAcceptDisabled] = useState(false);


  // Fetch the latest active job for this driver
  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/driver/active-ride?email=${encodeURIComponent(session.user.email)}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.completed) setActiveJob(data);
      });
  }, [session]);

  useEffect(() => {
    if (!session?.user?.email) return;
    socketRef.current = io('http://localhost:4000');
    socketRef.current.emit('register', { type: 'driver', id: session?.user?.email });

    socketRef.current.on('new_ride_request', (data) => {
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
      // Remove the confirmed ride from all drivers' requests
      setRequests((prev) => prev.filter(req =>
        !(req.pickup === ride.pickup && req.dropoff === ride.dropoff && req.userId === ride.userId)
      ));
      // Only set as active job for the driver who got the ride
      if (ride.driverId === session?.user?.email) {
        setActiveJob(ride);
      } else {
        setActiveJob(null);
      }
    });

    return () => socketRef.current.disconnect();
  }, [session]);

  const handleAccept = (request) => {
    console.log("Button clicked");
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
    console.log('Countering request:', request);
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
            <button className="text-blue-600 text-sm font-medium">View All</button>
          </div>
          {requests.map((req, idx) => (
            <>
            <div key={idx} className="flex justify-between items-center py-2 border-t first:border-t-0">
              <div>
                <p className="font-medium">{req.pickup}</p>
                <p className="text-sm text-gray-500">{req.dropoff}</p>
                <p className="text-sm text-gray-500">
                  {req.counterPrice
                    ? `User Counter Offer: ${req.counterPrice}`
                    : `Offer Price: ${req.offerPrice}`}
                </p>

              </div>
              <button onClick={() => handleCounter(req)} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg">
                Counter Offer
              </button>
              {/* <button onClick={() => handleAccept(req)} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg">
                Accept
              </button> */}
               <button
                  onClick={() => handleAccept(req)}
                  className={`bg-blue-600 text-white px-4 py-1.5 rounded-lg ${acceptDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={acceptDisabled}
                >
                  Accept
                </button>
            </div>
            <div>
              <div className="h-48 w-min-3xl mt-2 rounded">
                <MapView
                  pickup={{ lat: req.pickupLat, lon: req.pickupLon, label: req.pickup }}
                  destination={{ lat: req.dropoffLat, lon: req.dropoffLon, label: req.dropoff }}
                />
              </div>
            </div>
            </>
          ))}

        </div>
      )}
    </div>
  );
};

export default JobRequests;
