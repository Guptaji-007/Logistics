"use client"
import React, { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import { useSearchParams } from 'next/navigation'
import { io } from "socket.io-client";
import { useSession } from 'next-auth/react';

const Page = () => {
  const searchParams = useSearchParams();
  const trackingId = searchParams.get("id") || "";
  const [orderdata, setorderdata] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const socketRef = useRef(null);
  const { data: session } = useSession();
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
    socketRef.current = io("http://localhost:4000");
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
  }, [trackingId, session]);

  return (
    <>
      <Navbar />
      <div className='text-white'>Track Your Shipment</div>
      <div className='text-white'>Tracking ID: {trackingId}</div>
      {driverLocation && (
        <div className='text-white'>
          Driver Live Location: Lat {driverLocation.lat}, Lon {driverLocation.lon}
        </div>
      )}
    </>
  )
}

export default Page