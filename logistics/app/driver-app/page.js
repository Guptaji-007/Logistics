'use client';
import React, { useState, useEffect, useRef } from 'react';
import dynamic from "next/dynamic";
import { io } from "socket.io-client";
import { Navigation, MapPin, Truck } from 'lucide-react';

const MapView = dynamic(() => import('../components/MapView'), { ssr: false });

export default function DriverAppPage() {
    const [code, setCode] = useState('');
    const [job, setJob] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    
    const socketRef = useRef();
    const watchIdRef = useRef(null);

    // Verify Code
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/driver/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            
            if (data.success) {
                setJob(data.ride);
                setIsAuthenticated(true);
                initSocket(data.ride.id, code);
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert("Connection Error");
        }
    };

    const initSocket = (rideId, authCode) => {
        socketRef.current = io("http://localhost:4000");
        
        socketRef.current.on('connect', () => {
            console.log("Connected to socket");
            socketRef.current.emit("join_assigned_ride", { code: authCode });
        });

        socketRef.current.on('ride_details', (updatedJob) => {
            setJob(updatedJob);
        });
    };

    const toggleTracking = () => {
        if (isTracking) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            setIsTracking(false);
        } else {
            if (!navigator.geolocation) return alert("Geolocation not supported");
            
            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    socketRef.current.emit("assigned_driver_location", {
                        lat: latitude,
                        lon: longitude
                    });
                },
                (err) => console.error(err),
                { enableHighAccuracy: true }
            );
            setIsTracking(true);
        }
    };

    // UI: Login Screen
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                    <div className="flex justify-center mb-6">
                        <div className="bg-blue-100 p-4 rounded-full">
                            <Truck className="w-12 h-12 text-blue-600" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-2">Driver Portal</h1>
                    <p className="text-gray-500 text-center mb-6">Enter the 6-digit code provided by your manager</p>
                    
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input 
                            type="text" 
                            maxLength="6"
                            placeholder="Enter Code (e.g. 123456)"
                            className="w-full text-center text-3xl tracking-[0.5em] font-mono border-2 border-gray-300 rounded-xl py-4 focus:border-blue-500 outline-none transition"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition">
                            Access Ride
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // UI: Job Dashboard
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
                <h2 className="font-bold text-lg">Current Job</h2>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${isTracking ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isTracking ? 'LIVE TRACKING ON' : 'TRACKING OFF'}
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Status Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                     <div className="flex items-start gap-4 mb-4">
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <MapPin className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Pickup</p>
                            <p className="font-medium text-lg">{job?.pickup}</p>
                        </div>
                     </div>
                     <div className="w-0.5 h-6 bg-gray-200 ml-5 -my-2"></div>
                     <div className="flex items-start gap-4 mt-4">
                        <div className="bg-orange-50 p-2 rounded-lg">
                            <MapPin className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Dropoff</p>
                            <p className="font-medium text-lg">{job?.dropoff}</p>
                        </div>
                     </div>
                </div>

                {/* Customer Info */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h3 className="text-sm font-bold text-gray-500 mb-2">CUSTOMER DETAILS</h3>
                    <p className="text-lg font-semibold">{job?.userName || "Guest User"}</p>
                    <a href={`tel:${job?.userPhone}`} className="text-blue-600 font-medium block mt-1">
                        {job?.userPhone || "No phone provided"}
                    </a>
                </div>

                {/* Controls */}
                <button 
                    onClick={toggleTracking}
                    className={`w-full py-4 rounded-xl font-bold text-xl shadow-lg transition transform active:scale-95 ${
                        isTracking 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                    {isTracking ? 'STOP TRIP' : 'START TRIP'}
                </button>
                
                {/* Map Preview */}
                <div className="h-64 rounded-xl overflow-hidden shadow-md border-2 border-white">
                     <MapView
                        pickup={{ lat: job?.pickupLat, lon: job?.pickupLon }}
                        destination={{ lat: job?.dropoffLat, lon: job?.dropoffLon }}
                     />
                </div>
            </div>
        </div>
    );
}