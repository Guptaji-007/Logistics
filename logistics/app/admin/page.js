'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic';
import { io } from "socket.io-client";
import AdminNav from '../DriverComponents/AdminNav'
import JobRequests from '../DriverComponents/JobRequest'
import ActiveJob from '../DriverComponents/ActiveJob'

const DriverProfile = dynamic(() => import('../DriverComponents/DriverProfile'), { ssr: false });

const AdminPage = () => {
  const { data: session } = useSession()
  const [driver, setDriver] = useState(null)
  
  const [activeRides, setActiveRides] = useState([]);
  const [completedRides, setCompletedRides] = useState([]); // New State
  const [loading, setLoading] = useState(true);
  
  const socketRef = useRef();

  // 1. Fetch Profile
  const fetchDriver = useCallback(async () => {
    if (!session?.user?.email) return;
    const res = await fetch(`/api/driver/profile?email=${encodeURIComponent(session.user.email)}`);
    if (res.ok) setDriver(await res.json());
  }, [session]);

  // 2. Fetch Data (Active + Completed)
  const fetchAllRides = useCallback(async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    try {
        // Fetch Active
        const activeRes = await fetch(`/api/manager/rides?email=${encodeURIComponent(session.user.email)}`);
        const activeData = await activeRes.json();
        if (activeData.rides) setActiveRides(activeData.rides);

        // Fetch Completed
        const historyRes = await fetch(`/api/manager/history?email=${encodeURIComponent(session.user.email)}`);
        const historyData = await historyRes.json();
        if (historyData.rides) setCompletedRides(historyData.rides);

    } catch (error) {
        console.error("Failed to load rides", error);
    } finally {
        setLoading(false);
    }
  }, [session]);

  // 3. Setup Socket for Live Updates
  useEffect(() => {
      fetchDriver();
      fetchAllRides();

      socketRef.current = io("https://logistics-bknd.onrender.com");
      
      // Listen for status updates
      socketRef.current.on('ride_status_update', ({ rideId, status }) => {
          if (status === 'completed') {
              // Move from Active to Completed immediately
              setActiveRides(prev => {
                  const ride = prev.find(r => r.id === rideId);
                  if (ride) {
                      setCompletedRides(curr => [{ ...ride, assignmentStatus: 'completed', completed: true }, ...curr]);
                      return prev.filter(r => r.id !== rideId);
                  }
                  return prev;
              });
          }
      });

      return () => { socketRef.current.disconnect(); }
  }, [fetchDriver, fetchAllRides]);

  // Callback from JobRequest component
  const handleRideConfirmed = (newRide) => {
    setActiveRides((prev) => [newRide, ...prev]);
  };

  return (
    <>
      <AdminNav />
      <main className="p-4 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-6">
          <DriverProfile email={session?.user?.email} refreshDriver={fetchDriver} />
          
          {driver && driver.isActive && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT: Requests */}
                <div className="lg:col-span-4 space-y-4">
                    <h3 className="text-xl font-bold text-gray-800 px-1">Incoming Requests</h3>
                    <JobRequests onRideConfirmed={handleRideConfirmed} />
                </div>

                {/* RIGHT: Fleet Management */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Active Fleet */}
                    <div>
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h3 className="text-xl font-bold text-gray-800">Active Fleet ({activeRides.length})</h3>
                            <button onClick={fetchAllRides} className="text-sm text-blue-600 hover:underline">Refresh</button>
                        </div>
                        <div className="space-y-4">
                            {activeRides.length === 0 ? (
                                <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center text-gray-400">No active rides.</div>
                            ) : (
                                activeRides.map((ride) => <ActiveJob key={ride.id} job={ride} />)
                            )}
                        </div>
                    </div>

                    {/* Completed Orders (New Section) */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4 px-1">Completed Orders ({completedRides.length})</h3>
                        <div className="space-y-3">
                            {completedRides.map((ride) => (
                                <div key={ride.id} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center opacity-75 hover:opacity-100 transition">
                                    <div>
                                        <p className="font-semibold text-gray-800">{ride.pickup} <span className="text-gray-400">➔</span> {ride.dropoff}</p>
                                        <p className="text-xs text-gray-500">Driver: {ride.assignedDriver?.fullName || "Unknown"}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">COMPLETED</span>
                                        <p className="text-sm font-bold mt-1">₹{ride.counterPrice || ride.offerPrice}</p>
                                    </div>
                                </div>
                            ))}
                            {completedRides.length === 0 && (
                                <p className="text-gray-400 text-sm px-1">No completed history yet.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default AdminPage