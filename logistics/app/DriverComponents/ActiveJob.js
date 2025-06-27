import React from 'react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

const ActiveJob = ({ job, onFinish }) => {
  const [startTrip, setstartTrip] = useState(false);
  const { data: session } = useSession();

  const setTrip = () =>{
    setstartTrip(!startTrip);
  }

  const finishTrip = () => {
    // Call the API to finish the trip
    fetch(`/api/driver/active-ride?rideId=${job.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Trip finished:', data);
        if (onFinish) onFinish(data); // Notify parent
      })
      .catch((error) => {
        console.error('Error finishing trip:', error);
      });
  }

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
          {!startTrip ? <button className="bg-blue-600 text-white px-4 py-2 rounded-lg" onClick={setTrip}>Start Trip</button>:
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg" onClick={finishTrip}>Finish</button>
          }
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">Navigate</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">Contact Customer</button>
        </div>
      </div>
    </div>
  );
};

export default ActiveJob;
