"use client"
import React, { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar'
import { useSearchParams } from 'next/navigation'
import { io } from "socket.io-client";
import { useSession } from 'next-auth/react';

const MapView = dynamic(() => import("../components/MapView"), { ssr: false });


const Page = () => {
  const searchParams = useSearchParams();
  const trackingId = searchParams.get("id") || "";
  const [orderdata, setorderdata] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const socketRef = useRef(null);
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);


  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;

    const fetchPickupAndDestination = async () => {
      const response = await fetch(`/api/rides/trackShipment?trackingId=${trackingId}`);
      const data = await response.json();
      if (data.ride) {
        setPickup({
          lat: data.ride.pickupLat,
          lon: data.ride.pickupLon,
          label: data.ride.pickup
        });
        setDestination({
          lat: data.ride.dropoffLat,
          lon: data.ride.dropoffLon,
          label: data.ride.dropoff
        });
      }
    };

    fetchPickupAndDestination();

  }, [session, trackingId]);

  console.log("Pickup Location:", pickup);
  console.log("Destination Location:", destination);

  console.log("Session Data:", session);
  useEffect(() => {
    const fetchOrderData = async () => {
      const response = await fetch(`/api/trackShipment?trackingId=${trackingId}`);
      const data = await response.json();
      setorderdata(data);
    };

    if (trackingId) {
      fetchOrderData();
    }

    return () => {
      setorderdata([]);
    };
  }, [trackingId]);

  // Listen for live driver location updates
  useEffect(() => {
    if (!trackingId) return;
    // socketRef.current = io("http://localhost:4000");
    // socketRef.current = io("https://logistics-hs8g.vercel.app");
    socketRef.current = io("https://logistics-zh4o.onrender.com");
    socketRef.current.emit("register1", { type: "user", id: session?.user?.email, rideId: trackingId });
    // Listen for driver_location event for this ride
    socketRef.current.on("driver_location", (data) => {
      if (data.rideId === trackingId) {
        setDriverLocation({ lat: data.lat, lon: data.lon });
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
    // }, [trackingId, session, driverLocation]);  // remove driverLocation from dependencies to avoid infinite loop
  }, [trackingId, session]);

  return (
    <>
      <Navbar />

      <div className="w-full h-0.5 bg-gray-400 opacity-15"></div>

      <div className="flex flex-col lg:flex-row min-h-screen text-white font-sans">
        {/* LEFT PANEL - SHIPMENT DETAILS */}
        <div className="w-full lg:w-[38%] p-6  border-r border-gray-700 shadow-xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-6">Order ID:<br></br> <span className="text-lime-400 font-mono text-2xl">{trackingId}</span></h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 bg-blue-600 rounded-full text-white font-medium">In Progress</span>
            </div>
          </div>

          {/* FROM LOCATION */}
          {pickup && (
            <div className="mb-6 mt-6">
              <p className="text-white uppercase text-s mb-1 mr-2">From:</p>
              <div className="bg-gray-800 rounded-md p-3 border border-gray-700">
                <h2 className="text-base font-semibold">{pickup.label}</h2>
                <p className="text-xs text-gray-400 mt-1">Lat: {pickup.lat}, Lon: {pickup.lon}</p>
              </div>
            </div>
          )}

          {/* TO LOCATION */}
          {destination && (
            <div className="mb-4">
              <p className="text-white uppercase text-s mb-1 mr-2">To:</p>
              <div className="bg-gray-800 rounded-md p-3 border border-gray-700">
                <h2 className="text-base font-semibold">{destination.label}</h2>
                <p className="text-xs text-gray-400 mt-1">Lat: {destination.lat}, Lon: {destination.lon}</p>
              </div>
            </div>
          )}

          {/* DRIVER LOCATION */}
          {driverLocation && (
            <div className="mb-4">
              <p className="text-gray-400 uppercase text-xs mb-1">Driver Live Location</p>
              <div className="bg-green-900/30 rounded-md p-3 border border-green-700 text-green-300">
                Lat: {driverLocation.lat}, Lon: {driverLocation.lon}
              </div>
            </div>
          )}

          {/* TIMING DETAILS */}
          <div className="mt-6 text-sm text-gray-300 space-y-1">
            <p><strong>📦 Status:</strong> In Transit</p>
            <p><strong>🚚 Carrier:</strong> Logistique Express</p>
            <p><strong>🕒 Last Updated:</strong> Just Now</p>
          </div>

          {/* ALERT BOX */}
          <div className="mt-6 p-3 bg-red-900/30 border border-red-700 rounded text-sm text-red-300">
            ⚠️ High volume: Package may be delayed due to peak season.
          </div>
        </div>

        {/* RIGHT PANEL - MAP */}
        <div className="w-full lg:w-[62%] h-[calc(100vh-64px)]">
          {pickup && destination && (
            <div className="w-full h-full">
              <MapView
                key={`${pickup?.lat}-${pickup?.lon}-${destination?.lat}-${destination?.lon}`}
                pickup={{ lat: pickup.lat, lon: pickup.lon, label: pickup.label }}
                destination={{ lat: destination.lat, lon: destination.lon, label: destination.label }}
                driverLocation={driverLocation}
              />

            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Page
