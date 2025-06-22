'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bell,User } from 'lucide-react';

const DriverProfile = ({ email }) => {
  const [driver, setDriver] = useState(null);
  const [active, setActive] = useState(false);

  const fetchDriver = async () => {
    const res = await fetch(`/api/driver/profile?email=${encodeURIComponent(email)}`);
    if (res.ok) {
      const data = await res.json();
      setDriver(data);
      setActive(data.isActive); // set local state
    }
  };

  const toggleActive = async () => {
    const newStatus = !active;
    setActive(newStatus); // Optimistic UI update

    const res = await fetch('/api/driver/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, isActive: newStatus }),
    });

    if (res.ok) {
      const updatedDriver = await res.json();
      setDriver(updatedDriver); // Sync updated info
      console.log(`Driver is now ${updatedDriver.isActive ? 'active' : 'inactive'}`);
    } else {
      console.error('Failed to update status');
      setActive(!newStatus); // Revert if failed
    }
  };

  useEffect(() => {
    if (email) fetchDriver();
  }, [email]);

  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow">
      <div className="flex items-center gap-4">
        {/* <img src="/avatar.png" alt="Driver" className="w-12 h-12 rounded-full" /> */}
        <User className="ml-4 text-gray-500 cursor-pointer" />

        <div>
          <h2 className="text-lg font-semibold">
            {driver ? driver.fullName : "Loading..."}
          </h2>
          <p className="text-sm text-gray-500">Driver</p>
        </div>
      </div>
      <div className="text-right">
        <p>Today: <strong>$150.00</strong></p>
        <p>Weekly: <strong>$1,200.00</strong></p>
      </div>
      <button
        onClick={toggleActive}
        className={`px-4 py-2 rounded transition duration-300 ${
          active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        }`}
      >
        {active ? 'Active' : 'Inactive'}
      </button>
      <Bell className="ml-4 text-gray-500 cursor-pointer" />
    </div>
  );
};

export default DriverProfile;
