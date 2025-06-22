import React from 'react';

const requests = [
  { from: 'San Diego, CA', to: 'Phoenix, AZ', distance: '2.3 mi', price: '$150.00' },
  { from: 'Bakersfield, CA', to: 'Sacramento, CA', distance: '5.8 mi', price: '$200.00' },
  { from: 'Fresno, CA', to: 'Salt Lake City, UT', distance: '8.1 mi', price: '$350.00' },
];

const JobRequests = () => {
  return (
    <div className="bg-white p-4 rounded-2xl shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">New Job Requests</h3>
        <button className="text-blue-600 text-sm font-medium">View All</button>
      </div>
      {requests.map((job, i) => (
        <div key={i} className="flex justify-between items-center py-2 border-t first:border-t-0">
          <div>
            <p className="font-medium">{job.from}</p>
            <p className="text-sm text-gray-500">{job.to}</p>
          </div>
          <p className="text-sm text-gray-600">{job.distance}</p>
          <p className="font-semibold">{job.price}</p>
          <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg">Accept</button>
        </div>
      ))}
    </div>
  );
};

export default JobRequests;
