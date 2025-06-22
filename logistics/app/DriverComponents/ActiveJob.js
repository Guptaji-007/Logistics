import React from 'react';

const ActiveJob = () => {
  return (
    <div className="bg-white p-4 rounded-2xl shadow">
      <h3 className="text-lg font-semibold mb-4">Active Job</h3>
      <div className="space-y-2">
        <div>
          <p><strong>From:</strong> Los Angeles, CA</p>
          <p><strong>To:</strong> Las Vegas, NV</p>
        </div>
        <div>
          <p><strong>Customer:</strong> Michael Smith</p>
          <p className="text-sm text-gray-500">+1 555 123 4567</p>
        </div>
        <p className="text-lg font-semibold">$500.00</p>
        <div className="flex gap-4 mt-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">Start Trip</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">Navigate</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">Contact Customer</button>
        </div>
      </div>
    </div>
  );
};

export default ActiveJob;
