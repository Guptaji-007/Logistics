'use client';

import AdminNav from '@/app/DriverComponents/AdminNav';
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

const JoinFleetForm = () => {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    vehicleType: '',
    vehicleNumber: '',
    licenseNumber: '',
    experienceYears: '',
    address: '',
    managerId: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const submissionData = {
      ...formData,
      managerId: session?.user?.id,
    };

    try {
      const res = await fetch('/api/driver/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const result = await res.json();
      if (res.ok) {
        setMessage('Application submitted successfully!');
        setFormData({
          fullName: '',
          phone: '',
          email: '',
          vehicleType: '',
          vehicleNumber: '',
          licenseNumber: '',
          experienceYears: '',
          address: '',
          managerId: '',
        });
      } else {
        setMessage(result.error || 'Submission failed.');
      }
    } catch {
      setMessage('Submission failed.');
    }
  };

  return (

    <>
      <AdminNav />
      <div className="bg-white p-6 rounded-2xl shadow max-w-2xl mx-auto mt-8">
        <h2 className="text-2xl font-bold mb-6">Join the Fleet</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="border p-2 rounded"
            />
            <input
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
              className="border p-2 rounded"
            />
            <input
              name="email"
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="border p-2 rounded"
            />
            <select
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              required
              className="border p-2 rounded"
            >
              <option value="" disabled>Select Vehicle Type</option>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
              <option value="Car">Car</option>
              <option value="Motorcycle">Motorcycle</option>
            </select>
            <input
              name="vehicleNumber"
              placeholder="Vehicle Number"
              value={formData.vehicleNumber}
              onChange={handleChange}
              required
              className="border p-2 rounded"
            />
            <input
              name="licenseNumber"
              placeholder="License Number"
              value={formData.licenseNumber}
              onChange={handleChange}
              required
              className="border p-2 rounded"
            />
            <input
              name="experienceYears"
              placeholder="Years of Experience"
              type="number"
              min="0"
              value={formData.experienceYears}
              onChange={handleChange}
              required
              className="border p-2 rounded"
            />
          </div>
          <textarea
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            rows="3"
            required
            className="border p-2 rounded w-full"
          ></textarea>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Submit Application
          </button>
          {message && <div className="mt-4 text-center text-green-600">{message}</div>}
        </form>
      </div>

    </>
  );
};

export default JoinFleetForm;
