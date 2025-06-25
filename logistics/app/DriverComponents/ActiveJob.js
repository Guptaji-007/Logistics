import React from 'react';

const ActiveJob = ({ job }) => {
  if (!job) return null;
  return (
    <div className="bg-white p-4 rounded-2xl shadow">
      <h3 className="text-lg font-semibold mb-4">Active Job</h3>
      <div className="space-y-2">
        <div>
          <p><strong>From:</strong> {job.pickup}</p>
          <p><strong>To:</strong> {job.dropoff}</p>
        </div>
        <div>
          <p><strong>Customer:</strong> {job.userName || job.userId}</p>
          <p className="text-sm text-gray-500">{job.userPhone || ""}</p>
        </div>
        <p className="text-lg font-semibold">${job.counterPrice || job.offerPrice}</p>
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
