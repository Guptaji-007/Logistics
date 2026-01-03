'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { io } from "socket.io-client";
import { useSession } from 'next-auth/react';
import ConfirmRide from './ConfirmRide';
import dynamic from "next/dynamic";
import { BACKEND_URL } from '../../lib/backend';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { User, Mail, Phone, MapPin, ChevronsUpDown, CircleDollarSign, Truck, Info, Star } from 'lucide-react';

const InputField = ({ icon, ...props }) => (
    <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            {icon}
        </span>
        <input
            {...props}
            className="w-full rounded-lg border border-gray-300 p-3 pl-10 text-sm shadow-sm transition focus:border-green-500 focus:ring-2 focus:ring-green-500/50"
        />
    </div>
);

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function BookingForm() {
    const { data: session } = useSession();
    const [driverResponse, setDriverResponses] = useState([]);
    const [activeJob, setActiveJob] = useState(null);
    const [timers, setTimers] = useState({}); 

    const [isLoading, setIsLoading] = useState(true);
    const [pickupQuery, setPickupQuery] = useState('');
    const [pickupSuggestions, setPickupSuggestions] = useState([]);
    const [selectedPickup, setSelectedPickup] = useState(null);

    const [dropoffQuery, setDropoffQuery] = useState('');
    const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
    const [selectedDropoff, setSelectedDropoff] = useState(null);

    const [distance, setDistance] = useState(null);
    const [justSelected, setJustSelected] = useState(false);

    const pickupLat = selectedPickup ? selectedPickup.lat : null;
    const pickupLon = selectedPickup ? selectedPickup.lon : null;

    const { register, handleSubmit, formState: { errors }, setValue } = useForm();
    const socketRef = useRef();

    // Helper to safely update responses without duplicates
    const updateResponses = (newData) => {
        if (!newData || !newData.driverId) return;

        setDriverResponses(prev => {
            const map = new Map();
            prev.forEach(item => { if (item.driverId) map.set(item.driverId, item); });
            map.set(newData.driverId, newData);
            return Array.from(map.values());
        });
    };

    // Restore State logic
    useEffect(() => {
        if (!session?.user?.email) return;
        
        const fetchActiveRequest = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/api/ride-request/active/${session.user.email}`);
                const data = await res.json();
                
                if (data) {
                    setValue('pickup', data.pickup);
                    setValue('dropoff', data.dropoff);
                    
                    if (data.responses && data.responses.length > 0) {
                        data.responses.forEach(r => {
                             const formatted = {
                                driverId: r.driverId,
                                driverName: r.driverName || "Unknown Driver", // Restore Name
                                status: r.status === 'offered' ? 'accepted' : 'countered',
                                offerPrice: data.offerPrice,
                                counterPrice: r.price,
                                requestId: data.id,
                                userId: data.userId
                            };
                            updateResponses(formatted);
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to fetch active request", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActiveRequest();
    }, [session, setValue]);

    // Socket logic
    useEffect(() => {
        if (!session?.user?.email) return;
        socketRef.current = io(BACKEND_URL);
        socketRef.current.emit("register", { type: "user", id: session?.user?.email });

        socketRef.current.on("driver_response", (data) => updateResponses(data));
        socketRef.current.on("driver_counter_response", (data) => updateResponses(data));
        
        socketRef.current.on('ride_confirmed', (ride) => {
            setActiveJob(ride);
            setDriverResponses([]);
        });

        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, [session]);

    // ... (Autocomplete and Route logic remains same, omitted for brevity to focus on the fix) ...
    // Pickup/Dropoff/Route effects from previous version go here
    // Pickup autocomplete
    useEffect(() => {
        if (justSelected) {
            setJustSelected(false);
            return;
        }
        const timeout = setTimeout(() => {
            if (pickupQuery.length >= 3) {
                fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(pickupQuery)}&limit=5`)
                    .then(res => res.json())
                    .then(data => {
                        setPickupSuggestions(data.features.map(f => ({
                            label: `${f.properties.name || ''}${f.properties.city ? ', ' + f.properties.city : ''}, ${f.properties.country || ''}`,
                            lat: f.geometry.coordinates[1],
                            lon: f.geometry.coordinates[0],
                        })));
                    });
            } else {
                setPickupSuggestions([]);
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [pickupQuery, justSelected]);

    // Dropoff autocomplete
    useEffect(() => {
        if (justSelected) {
            setJustSelected(false);
            return;
        }
        const timeout = setTimeout(() => {
            if (dropoffQuery.length >= 3) {
                fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(dropoffQuery)}&limit=5`)
                    .then(res => res.json())
                    .then(data => {
                        setDropoffSuggestions(data.features.map(f => ({
                            label: `${f.properties.name || ''}${f.properties.city ? ', ' + f.properties.city : ''}, ${f.properties.country || ''}`,
                            lat: f.geometry.coordinates[1],
                            lon: f.geometry.coordinates[0],
                        })));
                    });
            } else {
                setDropoffSuggestions([]);
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [dropoffQuery, justSelected]);

    // Calculate route
    useEffect(() => {
        const getRouteDistance = async (lat1, lon1, lat2, lon2) => {
            const res = await fetch(`/api/route?lat1=${lat1}&lon1=${lon1}&lat2=${lat2}&lon2=${lon2}`);
            if (!res.ok) throw new Error("Route API error");
            return await res.json();
        };
        if (selectedPickup && selectedDropoff) {
            getRouteDistance(
                selectedPickup.lat, selectedPickup.lon,
                selectedDropoff.lat, selectedDropoff.lon
            )
                .then(route => setDistance(`${route.distanceKm} km (${route.durationMin} min)`))
                .catch(() => setDistance(null));
        }
    }, [selectedPickup, selectedDropoff]);

    // Set form values
    useEffect(() => {
        if (selectedPickup) {
            setValue('pickup', selectedPickup.label);
            setValue('pickupLat', selectedPickup.lat);
            setValue('pickupLon', selectedPickup.lon);
        }
    }, [selectedPickup, setValue]);
    useEffect(() => {
        if (selectedDropoff) {
            setValue('dropoff', selectedDropoff.label);
            setValue('dropoffLat', selectedDropoff.lat);
            setValue('dropoffLon', selectedDropoff.lon);
        }
    }, [selectedDropoff, setValue]);

    const onSubmit = async (data) => {
        alert("Booking submitted! Waiting for driver responses...");
        try {
            const res = await fetch(`${BACKEND_URL}/api/ride-request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    userId: session?.user?.email,
                    userName: session?.user?.name,
                    userPhone: data.phone
                })
            });
            console.log("Request created");
        } catch (e) { console.error(e); }
    };
    
    // Timer logic
    useEffect(() => {
        driverResponse.forEach(resp => {
            if (resp.status === "accepted" && !timers[resp.driverId]) {
                const timeoutId = setTimeout(() => {
                    setDriverResponses(prev => prev.filter(r => r.driverId !== resp.driverId));
                    setTimers(prev => { const u = { ...prev }; delete u[resp.driverId]; return u; });
                }, 10000);
                setTimers(prev => ({ ...prev, [resp.driverId]: timeoutId }));
            }
        });
        return () => Object.values(timers).forEach(clearTimeout);
    }, [driverResponse, timers]);

    const handleConfirm = (resp) => {
        if (timers[resp.driverId]) {
            clearTimeout(timers[resp.driverId]);
            setTimers(prev => { const u = { ...prev }; delete u[resp.driverId]; return u; });
        }
    };

    return (
        <section className="min-h-screen w-full flex items-center justify-center px-4 py-8 sm:p-6 md:p-10 bg-gray-50 border-t-4 border-green-500">
            <div className="w-full max-w-2xl mx-auto p-6 sm:p-8 bg-white rounded-xl shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Book Your Shipment</h2>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* ... (Fields remain same as before) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField icon={<User size={16} />} placeholder="Name" {...register('name')} />
                        <InputField icon={<Mail size={16} />} placeholder="Email" {...register('email')} />
                    </div>
                    <InputField icon={<Phone size={16} />} placeholder="Phone" {...register('phone')} />
                    
                    {/* Location Inputs with Autocomplete hooks connected above */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         {/* Pickup */}
                         <div className="relative">
                            <InputField icon={<MapPin size={16} />} placeholder="Pick-up" value={pickupQuery} onChange={e => {setPickupQuery(e.target.value); setSelectedPickup(null);}} />
                            {pickupSuggestions.length > 0 && (
                                <ul className="absolute mt-1 bg-white border w-full max-h-40 overflow-y-auto z-10 shadow-lg rounded-md">
                                    {pickupSuggestions.map((s, i) => (
                                        <li key={i} className="p-2 text-sm hover:bg-gray-100 cursor-pointer" onClick={() => {setSelectedPickup(s); setPickupQuery(s.label); setPickupSuggestions([]);}}>
                                            {s.label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <input type="hidden" {...register('pickup')} />
                            <input type="hidden" {...register('pickupLat')} />
                            <input type="hidden" {...register('pickupLon')} />
                        </div>
                        {/* Dropoff */}
                        <div className="relative">
                            <InputField icon={<MapPin size={16} />} placeholder="Drop-off" value={dropoffQuery} onChange={e => {setDropoffQuery(e.target.value); setSelectedDropoff(null);}} />
                            {dropoffSuggestions.length > 0 && (
                                <ul className="absolute mt-1 bg-white border w-full max-h-40 overflow-y-auto z-10 shadow-lg rounded-md">
                                    {dropoffSuggestions.map((s, i) => (
                                        <li key={i} className="p-2 text-sm hover:bg-gray-100 cursor-pointer" onClick={() => {setSelectedDropoff(s); setDropoffQuery(s.label); setDropoffSuggestions([]);}}>
                                            {s.label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <input type="hidden" {...register('dropoff')} />
                            <input type="hidden" {...register('dropoffLat')} />
                            <input type="hidden" {...register('dropoffLon')} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <select {...register('serviceType')} className="w-full rounded-lg border border-gray-300 p-3 pl-3 text-sm">
                            <option value="">Select Service</option>
                            <option value="Intra-City">Intra-City</option>
                            <option value="On-Demand">On-Demand</option>
                        </select>
                        <InputField icon={<CircleDollarSign size={16} />} type="number" placeholder="Offer Price" {...register('offerPrice')} />
                    </div>
                     <textarea {...register('details')} placeholder="Details" className="w-full rounded-lg border border-gray-300 p-3 text-sm" rows={3}></textarea>

                    <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">
                        Book Now
                    </button>
                </form>
                
                {selectedPickup && selectedDropoff && (
                    <div className="mt-6 w-full h-48 rounded-lg overflow-hidden border">
                        <MapView pickup={selectedPickup} destination={selectedDropoff} />
                    </div>
                )}

                {/* === UPDATED DRIVER RESPONSE SECTION === */}
                <div className="mt-8 space-y-4">
                    {driverResponse.map((resp) => (
                        <div key={resp.driverId} className="bg-white border rounded-xl shadow-sm p-5 border-l-4 border-l-green-500 animate-in fade-in slide-in-from-bottom-4">
                            
                            {/* Driver Info Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{resp.driverName || "Driver"}</h4>
                                        <div className="flex items-center text-xs text-gray-500">
                                            <Star size={12} className="text-yellow-400 fill-yellow-400 mr-1"/>
                                            <span>4.8 (Verified)</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                                    {resp.status === 'accepted' ? 'Accepted Offer' : 'Counter Offer'}
                                </div>
                            </div>

                            {/* Price Comparison Block */}
                            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Your Offer</p>
                                    <p className="text-lg font-bold text-gray-700">₹{resp.offerPrice}</p>
                                </div>
                                
                                <div className="h-8 w-px bg-gray-300 mx-2"></div>

                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold text-right">
                                        {resp.status === 'countered' ? 'Driver Asks' : 'Final Price'}
                                    </p>
                                    <p className={`text-lg font-bold text-right ${resp.status === 'countered' ? 'text-amber-600' : 'text-green-600'}`}>
                                        ₹{resp.counterPrice || resp.offerPrice}
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                {resp.status === 'countered' && (
                                    <button
                                        onClick={() => {
                                            const userCounter = prompt("Enter your new price:");
                                            if (userCounter) {
                                                socketRef.current.emit("user_counter_response", {
                                                    ...resp,
                                                    userId: session?.user?.email,
                                                    counterPrice: parseFloat(userCounter),
                                                    status: "user_countered",
                                                    pickupLat: pickupLat,
                                                    pickupLon: pickupLon,
                                                });
                                            }
                                        }}
                                        className="py-2 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Counter
                                    </button>
                                )}
                                
                                <div className={`${resp.status === 'accepted' ? 'col-span-2' : ''}`}>
                                    <ConfirmRide rideData={resp} onConfirm={() => handleConfirm(resp)} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}