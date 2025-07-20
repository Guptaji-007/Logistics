'use client';

import React, { useEffect, useState } from 'react';
import { Bell, User } from 'lucide-react';
import CurrentLocation from './CurrentLocation';


const DriverProfile = ({ email, refreshDriver }) => {
  const [driver, setDriver] = useState(null);
  const [active, setActive] = useState(false);

  const fetchDriver = async () => {
    const res = await fetch(`/api/driver/profile?email=${encodeURIComponent(email)}`);
    if (res.ok) {
      const data = await res.json();
      setDriver(data);
      setActive(data.isActive);
    }
  };

  const toggleActive = async () => {
    const newStatus = !active;
    setActive(newStatus); // optimistic update

    const res = await fetch('/api/driver/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, isActive: newStatus }),
    });

    if (res.ok) {
      const updatedDriver = await res.json();
      setDriver(updatedDriver);
      if (refreshDriver) refreshDriver(); // inform parent to re-fetch driver data
    } else {
      console.error('Failed to update status');
      setActive(!newStatus); // revert if failed
    }
  };

  useEffect(() => {
    if (email) fetchDriver();
  }, [email]);

  return (
    // Main container: Stacks vertically on mobile, horizontally on small screens and up.
    <>
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-4 rounded-2xl shadow-md gap-4">
      
      {/* Driver Info Section */}
      <div className="flex items-center gap-4">
        <User className="w-10 h-10 text-gray-500 flex-shrink-0" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {driver ? driver.fullName : "Loading..."}
          </h2>
          <p className="text-sm text-gray-500">Driver</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-x-6 gap-y-4">
        
        {/* Earnings */}
        <div className="text-left sm:text-right">
          <p className="text-sm text-gray-500">Today Earnings</p>
          <p className="font-bold text-gray-900">$0.00</p>
        </div>

        {/* Icons are grouped together */}
        <div className="flex items-center gap-4">
            <Bell className="text-gray-500 cursor-pointer w-6 h-6" />
            <CurrentLocation/>
        </div>

        <button
          onClick={toggleActive}
          className={`w-full sm:w-auto order-first sm:order-none px-4 py-2 rounded-lg font-semibold text-sm transition duration-300 ${
            active ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          {active ? 'Active' : 'Inactive'}
        </button>

      </div>
    </div>
    </>
  );
};
export default DriverProfile;
