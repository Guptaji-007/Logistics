import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from "next/dynamic";
import { io } from "socket.io-client";
import { BACKEND_URL } from '../../lib/backend';
import { ChevronDown, ChevronUp, Truck, MapPin } from 'lucide-react';

const MapView = dynamic(() => import('../components/MapView'), { ssr: false });

const ActiveJob = ({ job }) => {
  const { data: session } = useSession();
  
  // Collapsible State
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Assignment State
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [assignmentCode, setAssignmentCode] = useState(job.driverVerificationCode || null);
  const [isAssigned, setIsAssigned] = useState(!!job.assignedDriverId || !!job.driverVerificationCode);
  const [driverLocation, setDriverLocation] = useState(null);

  const socketRef = useRef();

  // Load My Drivers
  useEffect(() => {
    if (session?.user?.email && isExpanded && !drivers.length) {
      fetch(`/api/manager/my-drivers?email=${encodeURIComponent(session.user.email)}`)
        .then(res => res.json())
        .then(data => { if (data.drivers) setDrivers(data.drivers); });
    }
  }, [session, isExpanded]);

  // Socket Logic for Tracking
  useEffect(() => {
    if (!isExpanded) return; // Only connect when expanded to save resources

    socketRef.current = io(BACKEND_URL);
    
    if (isAssigned) {
         // Join room as "Manager Viewer"
         socketRef.current.emit("join_assigned_ride", { code: "VIEW_ONLY" }); 
         socketRef.current.emit("register", { type: "user", id: `MANAGER_${job.id}`, rideId: job.id });
         
         socketRef.current.on("driver_location", (data) => {
             if (data.rideId === job.id) {
                 setDriverLocation({ lat: data.lat, lon: data.lon });
             }
         });
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [isExpanded, isAssigned, job.id]);

  const handleAssign = async () => {
    if (!selectedDriver) return alert("Select a driver");
    
    const res = await fetch('/api/manager/assign-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            rideId: job.id,
            managerEmail: session.user.email,
            driverId: selectedDriver
        })
    });
    
    const data = await res.json();
    if (data.success) {
        setAssignmentCode(data.code);
        setIsAssigned(true);
    } else {
        alert("Error: " + data.error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header (Always Visible) */}
      <div 
        className="p-4 flex justify-between items-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isAssigned ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                <Truck size={20} />
            </div>
            <div>
                <h4 className="font-semibold text-gray-800">{job.pickup}</h4>
                <p className="text-xs text-gray-500">to {job.dropoff}</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2 py-1 rounded ${isAssigned ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                {isAssigned ? 'ASSIGNED' : 'PENDING'}
            </span>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
          <div className="p-4 border-t border-gray-100">
             
             {/* Customer & Price Info */}
             <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                    <p className="text-gray-500">Customer</p>
                    <p className="font-medium">{job.userName || job.userId}</p>
                    <p className="text-xs text-blue-600">{job.userPhone}</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500">Price</p>
                    <p className="font-bold text-lg">₹{job.counterPrice || job.offerPrice}</p>
                </div>
             </div>

             {/* Assignment Section */}
             {!isAssigned ? (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <label className="block text-xs font-bold text-blue-800 mb-2">ASSIGN DRIVER</label>
                    <div className="flex gap-2">
                        <select 
                            className="flex-1 text-sm p-2 border rounded"
                            value={selectedDriver}
                            onChange={(e) => setSelectedDriver(e.target.value)}
                        >
                            <option value="">Choose Driver...</option>
                            {drivers.map(d => (
                                <option key={d.id} value={d.id}>{d.fullName}</option>
                            ))}
                        </select>
                        <button 
                            onClick={handleAssign}
                            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Assign
                        </button>
                    </div>
                </div>
             ) : (
                <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center mb-4">
                    <p className="text-xs text-green-800 font-bold uppercase">Verification Code</p>
                    <p className="text-2xl font-mono font-bold tracking-widest text-gray-800 my-1">
                        {assignmentCode}
                    </p>
                    <p className="text-xs text-green-600">Give this code to the driver</p>
                </div>
             )}

             {/* Live Map (Only if Assigned) */}
             {isAssigned && (
                 <div className="h-64 mt-4 rounded-lg overflow-hidden border">
                    <MapView 
                        pickup={{ lat: job.pickupLat, lon: job.pickupLon }}
                        destination={{ lat: job.dropoffLat, lon: job.dropoffLon }}
                        driverLocation={driverLocation}
                    />
                 </div>
             )}
          </div>
      )}
    </div>
  );
};

export default ActiveJob;