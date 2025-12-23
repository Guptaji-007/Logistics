'use client';
import React, { useState, useEffect, useRef } from 'react';
import dynamic from "next/dynamic";
import { io } from "socket.io-client";
import { 
  MapPin, 
  Truck, 
  Phone, 
  Navigation, 
  LogOut, 
  CheckCircle2, 
  CircleDot 
} from 'lucide-react';

const MapView = dynamic(() => import('../components/MapView'), { ssr: false });

export default function DriverAppPage() {
    const [code, setCode] = useState('');
    const [job, setJob] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const socketRef = useRef();
    const watchIdRef = useRef(null);

    // Verify Code
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
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
                alert(data.error || "Invalid code");
            }
        } catch (err) {
            alert("Connection Error. Please try again.");
        } finally {
            setIsLoading(false);
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
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
            setIsTracking(false);
        } else {
            if (!navigator.geolocation) return alert("Geolocation not supported");
            
            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    socketRef.current?.emit("assigned_driver_location", {
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

    // --- SCREEN 1: LOGIN ---
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <div className="flex justify-center mb-8">
                        <div className="bg-blue-600 p-5 rounded-full shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20">
                            <Truck className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-3xl p-8 shadow-2xl">
                        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Driver Portal</h1>
                        <p className="text-slate-500 text-center mb-8 text-sm">Enter the 6-digit trip code provided by your fleet manager.</p>
                        
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Access Code</label>
                                <input 
                                    type="text" 
                                    maxLength="6"
                                    inputMode="numeric"
                                    placeholder="000000"
                                    className="w-full text-center text-4xl tracking-[0.5em] font-mono border-b-2 border-slate-200 py-4 focus:border-blue-600 outline-none transition bg-transparent text-slate-800 placeholder-slate-200"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isLoading || code.length < 6}
                                className="w-full bg-blue-600 disabled:bg-slate-300 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                            >
                                {isLoading ? 'Verifying...' : 'Start Shift'}
                            </button>
                        </form>
                    </div>
                    <p className="text-slate-500 text-center mt-8 text-xs">© 2024 Logistics Driver App</p>
                </div>
            </div>
        );
    }

    // --- SCREEN 2: DASHBOARD ---
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            
            {/* Top Bar */}
            <div className="bg-white px-4 py-3 shadow-sm z-20 flex justify-between items-center sticky top-0">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <Truck size={20} className="text-blue-700" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 text-sm leading-tight">Active Trip</h2>
                        <p className="text-xs text-slate-500 font-mono">#{code}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${isTracking ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                    {isTracking ? 'LIVE' : 'OFFLINE'}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 p-4 space-y-4 pb-32">
                
                {/* Status Alert */}
                {!isTracking && (
                    <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex gap-3 items-center">
                        <CircleDot className="text-orange-500 w-5 h-5 flex-shrink-0" />
                        <p className="text-sm text-orange-800">You are currently offline. Start the trip to share location.</p>
                    </div>
                )}

                {/* Map Card */}
                <div className="h-64 rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white relative">
                     <MapView
                        pickup={{ lat: job?.pickupLat, lon: job?.pickupLon }}
                        destination={{ lat: job?.dropoffLat, lon: job?.dropoffLon }}
                     />
                     {/* Floating Map Button */}
                     <button className="absolute top-3 right-3 bg-white p-2 rounded-lg shadow-md hover:bg-slate-50 z-[400]" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${job?.pickupLat},${job?.pickupLon}&destination=${job?.dropoffLat},${job?.dropoffLon}`)}>
                        <Navigation size={20} className="text-blue-600" />
                     </button>
                </div>

                {/* Trip Timeline Card */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="relative pl-4 border-l-2 border-dashed border-slate-200 space-y-8 my-2">
                        
                        {/* Pickup */}
                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-4 h-4 bg-green-500 rounded-full ring-4 ring-white shadow-sm"></div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Pickup Location</p>
                            <h3 className="font-semibold text-slate-800 text-lg leading-tight">{job?.pickup}</h3>
                        </div>

                        {/* Dropoff */}
                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-4 h-4 bg-red-500 rounded-full ring-4 ring-white shadow-sm"></div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Destination</p>
                            <h3 className="font-semibold text-slate-800 text-lg leading-tight">{job?.dropoff}</h3>
                        </div>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Customer</p>
                        <h3 className="font-bold text-slate-800 text-lg">{job?.userName || "Guest User"}</h3>
                        <p className="text-sm text-slate-500">{job?.userPhone || "No contact info"}</p>
                    </div>
                    {job?.userPhone && (
                        <a href={`tel:${job.userPhone}`} className="bg-green-100 p-3 rounded-full hover:bg-green-200 transition">
                            <Phone className="text-green-700 w-6 h-6" />
                        </a>
                    )}
                </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 pb-8 z-30">
                <button 
                    onClick={toggleTracking}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 ${
                        isTracking 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30'
                    }`}
                >
                    {isTracking ? (
                        <>
                            <LogOut size={22} />
                            STOP TRIP
                        </>
                    ) : (
                        <>
                            <Navigation size={22} />
                            START TRIP
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}