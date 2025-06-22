'use client';

import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

const DriverProfile = ({ email }) => {
  const [driver, setDriver] = useState(null);

  useEffect(() => {
    if (!email) return;
    const fetchDriver = async () => {
      const res = await fetch(`/api/driver/profile?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setDriver(data);
      }
    };
    fetchDriver();
  }, [email]);

  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow">
      <div className="flex items-center gap-4">
        <img
          src="/avatar.png"
          alt="Driver"
          className="w-12 h-12 rounded-full"
        />
        <div>
          <h2 className="text-lg font-semibold">{driver ? driver.fullName : "Loading..."}</h2>
          <p className="text-sm text-gray-500">Driver</p>
        </div>
      </div>
      <div className="text-right">
        <p>Today: <strong>$150.00</strong></p>
        <p>Weekly: <strong>$1,200.00</strong></p>
      </div>
      <Bell className="ml-4 text-gray-500 cursor-pointer" />
    </div>
  );
};

export default DriverProfile;
