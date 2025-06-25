'use client'
import React, { useState } from 'react'
import { useSession } from 'next-auth/react'


import AdminNav from '../DriverComponents/AdminNav'
import DriverProfile from '../DriverComponents/DriverProfile'
import ActiveJob from '../DriverComponents/ActiveJob'
import JobRequests from '../DriverComponents/JobRequest'
const AdminPage = () => {
  const { data: session } = useSession()
  const [activeJob, setActiveJob] = useState(null)

  return (
    <>
      <AdminNav />
       <main className="p-6 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-6">
          <DriverProfile email={session?.user?.email}/>
          {activeJob ? (
            <ActiveJob job={activeJob} />
          ) : (
            <JobRequests />
          )}
        </div>
      </main>
    </>
  )
}

export default AdminPage