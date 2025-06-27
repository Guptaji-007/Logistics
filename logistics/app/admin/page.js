'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

import AdminNav from '../DriverComponents/AdminNav'
import DriverProfile from '../DriverComponents/DriverProfile'
import ActiveJob from '../DriverComponents/ActiveJob'
import JobRequests from '../DriverComponents/JobRequest'

const AdminPage = () => {
  const { data: session } = useSession()
  const [activeJob, setActiveJob] = useState(null)
  const [driver, setDriver] = useState(null)

  const fetchDriver = useCallback(async () => {
    if (!session?.user?.email) return;
    const res = await fetch(`/api/driver/profile?email=${encodeURIComponent(session.user.email)}`);
    if (res.ok) {
      const data = await res.json();
      setDriver(data);
    } else {
      console.error('Failed to fetch driver profile');
    }
  }, [session])

  useEffect(() => {
    fetchDriver()
  }, [fetchDriver])

  return (
    <>
      <AdminNav />
      <main className="p-6 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-6">
          <DriverProfile email={session?.user?.email} refreshDriver={fetchDriver} />
          {driver && !driver.isActive && (
            <div className="bg-white p-4 rounded-2xl shadow">
              <h3 className="text-lg font-semibold mb-4">Driver Status</h3>
              <p className="text-sm text-gray-500">Your account is currently inactive.</p>
            </div>
          )}

          {driver && driver.isActive && (
            activeJob ? (
              <ActiveJob job={activeJob} />
            ) : (
              <JobRequests />
            )
          )}
        </div>
      </main>
    </>
  )
}

export default AdminPage
