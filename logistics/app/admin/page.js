'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic';
import AdminNav from '../DriverComponents/AdminNav'
import JobRequests from '../DriverComponents/JobRequest'
import ActiveJob from '../DriverComponents/ActiveJob'

// Dynamic import for Profile to avoid hydration issues
const DriverProfile = dynamic(
  () => import('../DriverComponents/DriverProfile'),
  { ssr: false }
);

const AdminPage = () => {
  const { data: session } = useSession()
  const [driver, setDriver] = useState(null)
  const [activeRides, setActiveRides] = useState([]); // Array of active rides
  const [loadingRides, setLoadingRides] = useState(true);

  // 1. Fetch Manager Profile
  const fetchDriver = useCallback(async () => {
    if (!session?.user?.email) return;
    const res = await fetch(`/api/driver/profile?email=${encodeURIComponent(session.user.email)}`);
    if (res.ok) {
      const data = await res.json();
      setDriver(data);
    }
  }, [session]);

  // 2. Fetch Ongoing Rides (Persistence Fix)
  const fetchActiveRides = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
        const res = await fetch(`/api/manager/rides?email=${encodeURIComponent(session.user.email)}`);
        const data = await res.json();
        if (data.rides) {
            setActiveRides(data.rides);
        }
    } catch (error) {
        console.error("Failed to load active rides", error);
    } finally {
        setLoadingRides(false);
    }
  }, [session]);

  useEffect(() => {
    fetchDriver();
    fetchActiveRides();
  }, [fetchDriver, fetchActiveRides]);

  // Callback: When JobRequest finishes negotiation, add to Active list
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
                
                {/* LEFT COLUMN: Incoming Requests (Always Visible) */}
                <div className="lg:col-span-5 space-y-4">
                    <h3 className="text-xl font-bold text-gray-800 px-1">Incoming Requests</h3>
                    <JobRequests onRideConfirmed={handleRideConfirmed} />
                </div>

                {/* RIGHT COLUMN: Active/Assigned Rides (Collapsible Cards) */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-xl font-bold text-gray-800">Active Fleet ({activeRides.length})</h3>
                        <button onClick={fetchActiveRides} className="text-sm text-blue-600 hover:underline">
                            Refresh List
                        </button>
                    </div>

                    {loadingRides ? (
                        <p className="text-gray-500">Loading active trips...</p>
                    ) : activeRides.length === 0 ? (
                        <div className="bg-white p-6 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                            No active rides currently.
                        </div>
                    ) : (
                        activeRides.map((ride) => (
                            <ActiveJob key={ride.id} job={ride} />
                        ))
                    )}
                </div>

            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default AdminPage