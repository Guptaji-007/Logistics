import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from "next/dynamic";
import { io } from "socket.io-client";

const MapView = dynamic(() => import('../components/MapView'), { ssr: false });

const ActiveJob = ({ job, onFinish }) => {
  const [startTrip, setstartTrip] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const { data: session } = useSession();
  const watchIdRef = useRef(null);
  const socketRef = useRef();
  const [driverLocation, setDriverLocation] = useState(null);

  useEffect(() => {
    // socketRef.current = io("http://localhost:4000");
    socketRef.current = io("https://logistics-zh4o.onrender.com");
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // const setTrip = () => {
  //   setstartTrip(!startTrip);
  //   if (typeof window !== "undefined" && navigator.geolocation)  {
  //     alert("Geolocation not supported");
  //     return;
  //   }

  //   watchIdRef.current = navigator.geolocation.watchPosition(
  //     (position) => {
  //       const { latitude, longitude } = position.coords;
  //       setDriverLocation({ lat: latitude, lon: longitude });
  //       socketRef.current.emit("register1", { type: "driver", id: session.user.email, lat: latitude, lon: longitude, rideId: job.id });
  //       socketRef.current.emit("driver_location_update", {
  //         rideId: job.id,
  //         lat: latitude,
  //         lon: longitude,
  //       });
  //       console.log("Sent location:", latitude, longitude);
  //     },
  //     (error) => {
  //       console.error("Error watching location", error);
  //     },
  //     {
  //       enableHighAccuracy: true,
  //       timeout: 10000,
  //       maximumAge: 0,
  //     }
  //   );
  // };

const setTrip = () => {
  setstartTrip(!startTrip);

  // CORRECT LOGIC:
  // Check if we are in the browser AND geolocation is supported.
  if (typeof window !== 'undefined' && navigator.geolocation) {
    // If yes, run the geolocation code inside this block.
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setDriverLocation({ lat: latitude, lon: longitude });
        socketRef.current.emit("register1", { type: "driver", id: session.user.email, lat: latitude, lon: longitude, rideId: job.id });
        socketRef.current.emit("driver_location_update", {
          rideId: job.id,
          lat: latitude,
          lon: longitude,
        });
        console.log("Sent location:", latitude, longitude);
      },
      (error) => {
        console.error("Error watching location", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  } else {
    // If no, alert the user and do nothing else.
    alert("Geolocation is not supported by this browser.");
  }
};


  const stopLiveLocation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      console.log("Stopped live location tracking");
    }
  };

  const finishTrip = () => {
    // Call the API to finish the trip
    fetch(`/api/driver/active-ride?rideId=${job.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Trip finished:', data);
        if (onFinish) onFinish(data); // Notify parent
      })
      .catch((error) => {
        console.error('Error finishing trip:', error);
      });
  }

  useEffect(() => {
    return () => stopLiveLocation();
  }, []);



  if (!job) return null;
  return (
    <div className="bg-white p-4 rounded-2xl shadow">
      <h3 className="text-lg font-semibold mb-4">Active Job</h3>
      <div className="space-y-2">
        <div>
          <p><strong>From:</strong> {job.pickup}</p>
          <p><strong>To:</strong> {job.dropoff}</p>
        </div>
        <div>
          <p><strong>Customer:</strong> {job.userName || job.userId}</p>
          <p className="text-sm text-gray-500">{job.userPhone || ""}</p>
        </div>
        <p className="text-lg font-semibold">${job.counterPrice || job.offerPrice}</p>
        <div className="flex gap-4 mt-2">
          {!startTrip ?
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg" onClick={() => { setTrip(); setShowMap(true); }}>Start Trip</button> :
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg" onClick={finishTrip}>Finish</button>
          }
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg" onClick={() => setShowMap(true)}>Navigate</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">Contact Customer</button>
        </div>
        {showMap && (
          <div className="h-64 mt-4">
            <MapView
              pickup={{ lat: job.pickupLat, lon: job.pickupLon, label: job.pickup }}
              destination={{ lat: job.dropoffLat, lon: job.dropoffLon, label: job.dropoff }}
              driverLocation={driverLocation}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveJob;