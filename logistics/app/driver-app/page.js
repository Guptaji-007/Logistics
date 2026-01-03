'use client';
import React, { useState, useRef, useEffect } from 'react';
import dynamic from "next/dynamic";
import { io } from "socket.io-client";
import { BACKEND_URL } from '../../lib/backend';
import { 
  Truck, Phone, Navigation, LogOut, CircleDot, MapPin, Play, CheckCircle
} from 'lucide-react';

const MapView = dynamic(() => import('../components/MapView'), { ssr: false });

export default function DriverAppPage() {
    const [code, setCode] = useState('');
    const [job, setJob] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [status, setStatus] = useState('assigned'); // assigned | in_progress | completed
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
                setStatus(data.ride.assignmentStatus);
                setIsAuthenticated(true);
                initSocket(data.ride.id, code);
                
                // Auto-start tracking if already in progress
                if(data.ride.assignmentStatus === 'in_progress') {
                    startLocationWatch();
                }
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
        socketRef.current = io(BACKEND_URL);
        
        socketRef.current.on('connect', () => {
            console.log("Connected to socket");
            socketRef.current.emit("join_assigned_ride", { code: authCode });
        });

        socketRef.current.on('ride_details', (updatedJob) => {
            setJob(updatedJob);
        });
    };

    // --- ACTIONS ---
    const startTrip = async () => {
        if (!confirm("Start the trip now?")) return;
        
        try {
            // 1. Update DB
            await fetch('/api/driver/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rideId: job.id, status: 'in_progress' })
            });

            // 2. Update UI
            setStatus('in_progress');
            
            // 3. Notify Socket
            socketRef.current.emit("ride_status_update", { rideId: job.id, status: 'in_progress' });
            
            // 4. Start Tracking
            startLocationWatch();
        } catch (error) {
            console.error(error);
            alert("Failed to start trip");
        }
    };

    const completeTrip = async () => {
        if (!confirm("Mark ride as completed?")) return;

        try {
            // 1. Stop Tracking
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);

            // 2. Update DB
            await fetch('/api/driver/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rideId: job.id, status: 'completed' })
            });

            // 3. Update UI
            setStatus('completed');

            // 4. Notify Socket
            socketRef.current.emit("ride_status_update", { rideId: job.id, status: 'completed' });
        } catch (error) {
            console.error(error);
            alert("Failed to complete trip");
        }
    };

    const startLocationWatch = () => {
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
    };

    // --- LOGIN SCREEN ---
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="w-full max-w-sm relative z-10">
                    <div className="flex justify-center mb-10">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-2xl shadow-2xl shadow-blue-500/20">
                            <Truck className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
                        <h1 className="text-3xl font-bold text-center text-white mb-2">Driver Portal</h1>
                        <p className="text-slate-400 text-center mb-8 text-sm">Enter your secure 6-digit trip code.</p>
                        <form onSubmit={handleLogin} className="space-y-8">
                            <div>
                                <input 
                                    type="text" maxLength="6" inputMode="numeric" placeholder="000000"
                                    className="w-full text-center text-4xl tracking-[0.5em] font-mono border-b-2 border-slate-700 py-4 focus:border-blue-500 outline-none transition-all bg-transparent text-white placeholder-slate-700"
                                    value={code} onChange={(e) => setCode(e.target.value)}
                                />
                            </div>
                            <button type="submit" disabled={isLoading || code.length < 6}
                                className="w-full bg-blue-600 disabled:bg-slate-800 disabled:text-slate-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-500 transition-all">
                                {isLoading ? 'Verifying...' : 'Start Shift'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // --- COMPLETED SCREEN ---
    if (status === 'completed') {
        return (
             <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Trip Completed!</h2>
                    <p className="text-slate-400 mb-8">Great job. The manager has been notified.</p>
                    <button onClick={() => window.location.reload()} className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-slate-700 transition">
                        Back to Login
                    </button>
                </div>
             </div>
        );
    }

    // --- DASHBOARD ---
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col text-slate-200">
            {/* Top Bar */}
            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-4 shadow-lg border-b border-slate-800 z-20 flex justify-between items-center sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                        <Truck size={20} className="text-blue-400" />
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-sm leading-tight">Active Trip</h2>
                        <p className="text-xs text-slate-500 font-mono tracking-wider">#{code}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${status === 'in_progress' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                    <div className={`w-2 h-2 rounded-full ${status === 'in_progress' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                    {status === 'in_progress' ? 'LIVE TRACKING' : 'ASSIGNED'}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 space-y-4 pb-32 overflow-y-auto">
                {/* Map */}
                <div className="h-64 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 relative">
                     <MapView pickup={{ lat: job?.pickupLat, lon: job?.pickupLon }} destination={{ lat: job?.dropoffLat, lon: job?.dropoffLon }} />
                     <button className="absolute top-3 right-3 bg-slate-800/90 text-white p-2.5 rounded-xl shadow-lg border border-slate-700 hover:bg-blue-600 z-[400]" 
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${job?.pickupLat},${job?.pickupLon}&destination=${job?.dropoffLat},${job?.dropoffLon}`)}>
                        <Navigation size={20} />
                     </button>
                </div>

                {/* Details */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                    <div className="flex items-start gap-4">
                         <div className="mt-1"><CircleDot size={16} className="text-blue-500" /></div>
                         <div><p className="text-xs text-slate-500 uppercase font-bold">Pickup</p><p className="text-white font-medium">{job?.pickup}</p></div>
                    </div>
                    <div className="flex items-start gap-4">
                         <div className="mt-1"><MapPin size={16} className="text-red-500" /></div>
                         <div><p className="text-xs text-slate-500 uppercase font-bold">Dropoff</p><p className="text-white font-medium">{job?.dropoff}</p></div>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 pb-8 z-30">
                {status === 'assigned' ? (
                    <button onClick={startTrip} className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all">
                        <Play size={22} fill="currentColor" /> START TRIP
                    </button>
                ) : (
                    <button onClick={completeTrip} className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all">
                        <CheckCircle size={22} /> COMPLETE DELIVERY
                    </button>
                )}
            </div>
        </div>
    );
}