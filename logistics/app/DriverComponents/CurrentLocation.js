import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LocateFixed } from 'lucide-react';

const CurrentLocation = () => {
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const { data: session } = useSession();

  const getliveLoc = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          console.log("Live Location:", { latitude, longitude });
        },
        (error) => {
          console.error("Error getting live location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  useEffect(() => {
    // Only update if both lat/lon and session are available
    if (
      session?.user?.email &&
      location.latitude !== null &&
      location.longitude !== null
    ) {
      const updatelocation = async () => {
        const res = await fetch(
          `/api/fetch-location?driver_email=${encodeURIComponent(session.user.email)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location }),
          }
        );
        if (res.ok) {
          console.log("Location updated successfully");
        }
      };
      updatelocation();
    }
  }, [location, session]);

  return (
    <>
      {/* <div>CurrentLocation</div> */}
      {/* <button onClick={getliveLoc}>Fetch live location</button> */}
      <button
        onClick={getliveLoc}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition"
      >
        <LocateFixed className="w-5 h-5" />
        Fetch Live Location
      </button>
      {/* {location.latitude && location.longitude && (
        <div>
          Latitude: {location.latitude}, Longitude: {location.longitude}
        </div>
      )} */}
    </>
  );
};

export default CurrentLocation;