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
    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow">
      <div className="flex items-center gap-4">
        <User className="ml-4 text-gray-500 cursor-pointer" />
        <div>
          <h2 className="text-lg font-semibold">
            {driver ? driver.fullName : "Loading..."}
          </h2>
          <p className="text-sm text-gray-500">Driver</p>
        </div>
      </div>
      <div className="text-right">
        <p>Today: <strong>$0</strong></p>
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
      <CurrentLocation/>
    </div>
  );
};

export default DriverProfile;
