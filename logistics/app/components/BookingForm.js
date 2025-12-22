'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { io } from "socket.io-client";
import { useSession } from 'next-auth/react';
import ConfirmRide from './ConfirmRide';
import dynamic from "next/dynamic";
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { User, Mail, Phone, MapPin, ChevronsUpDown, Check, CircleDollarSign, Truck, Info, Calendar } from 'lucide-react';

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
    const [timers, setTimers] = useState({}); // Track timers for each driver

    const [isLoading, setIsLoading] = useState(true);
    // Autocomplete states
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

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm();

    const socketRef = useRef();


    useEffect(() => {
        if (!session?.user?.email) return;
        
        const fetchActiveRequest = async () => {
            try {
                const res = await fetch(`http://localhost:4000/api/ride-request/active/${session.user.email}`);
                const data = await res.json();
                
                if (data) {
                    console.log("Restoring active request:", data);
                    // Pre-fill form or lock it
                    setValue('pickup', data.pickup);
                    setValue('dropoff', data.dropoff);
                    // Restore active job state or waiting state
                    // If you have a 'isSearching' state, set it true here
                    
                    // Restore driver responses
                    if (data.responses && data.responses.length > 0) {
                        const formattedResponses = data.responses.map(r => ({
                            driverId: r.driverId,
                            status: r.status === 'offered' ? 'accepted' : 'countered',
                            offerPrice: data.offerPrice,
                            counterPrice: r.price,
                            requestId: data.id,
                            userId: data.userId
                            // ... map other fields
                        }));
                        setDriverResponses(formattedResponses);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch active request", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActiveRequest();
    }, [session]);

    // Socket logic (unchanged)
    useEffect(() => {
        if (!session?.user?.email) return;
        socketRef.current = io("http://localhost:4000");
        // socketRef.current = io("https://logistics-hs8g.vercel.app");
        // socketRef.current = io("https://logistics-zh4o.onrender.com");
        socketRef.current.emit("register", { type: "user", id: session?.user?.email });

        socketRef.current.on("driver_response", (data) => {
            setDriverResponses(prev => {
                const idx = prev.findIndex(r => r.driverId === data.driverId);
                if (idx !== -1) {
                    const updated = [...prev];
                    updated[idx] = data;
                    return updated;
                }
                return [...prev, data];
            });
        });

        socketRef.current.on("driver_counter_response", (data) => {
            setDriverResponses(prev => {
                const idx = prev.findIndex(r => r.driverId === data.driverId);
                if (idx !== -1) {
                    const updated = [...prev];
                    updated[idx] = data;
                    return updated;
                }
                return [...prev, data];
            });
        });

        socketRef.current.on('ride_confirmed', (ride) => {
            setActiveJob(ride);
            setDriverResponses([]);
        });

        return () => socketRef.current.disconnect();
    }, [session]);

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
    }, [pickupQuery]);

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
    }, [dropoffQuery]);

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

    // Set form values when location is selected
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

    // const onSubmit = (data) => {
    //     // You can send pickup/dropoff coordinates as well
    //     socketRef.current.emit("ride_request", {
    //         ...data,
    //         userId: session?.user?.email,
    //         pickupLat: data.pickupLat,
    //         pickupLon: data.pickupLon,
    //         dropoffLat: data.dropoffLat,
    //         dropoffLon: data.dropoffLon,
    //     });
    //     reset();
    //     // setSelectedPickup(null);
    //     setSelectedDropoff(null);
    //     setPickupQuery('');
    //     setDropoffQuery('');
    // };


    const onSubmit = async (data) => {
        // 1. Create Request via API first (Persistence)
        try {
            const res = await fetch("http://localhost:4000/api/ride-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    userId: session?.user?.email,
                    userName: session?.user?.name, // Pass name
                    userPhone: data.phone
                })
            });
            
            const savedRequest = await res.json();
            
            // 2. No need to emit 'ride_request' manually if the API does it, 
            // OR emit it with the ID returned from API so drivers have the context.
            // If API handles emission (recommended), just set local state:
            console.log("Request created:", savedRequest);
            
        } catch (e) {
            console.error("Booking failed", e);
        }
    };
    
    // Handle accepted driver response timeout
    useEffect(() => {
        driverResponse.forEach(resp => {
            if (
                resp.status === "accepted" &&
                !timers[resp.driverId]
            ) {
                // Start a 5s timer for this driver
                const timeoutId = setTimeout(() => {
                    setDriverResponses(prev =>
                        prev.filter(r => r.driverId !== resp.driverId)
                    );
                    setTimers(prev => {
                        const updated = { ...prev };
                        delete updated[resp.driverId];
                        return updated;
                    });
                }, 10000);
                setTimers(prev => ({ ...prev, [resp.driverId]: timeoutId }));
            }
        });
        // Cleanup on unmount
        return () => {
            Object.values(timers).forEach(clearTimeout);
        };
    }, [driverResponse]);

    // When user confirms, clear the timer for that driver
    const handleConfirm = (resp) => {
        if (timers[resp.driverId]) {
            clearTimeout(timers[resp.driverId]);
            setTimers(prev => {
                const updated = { ...prev };
                delete updated[resp.driverId];
                return updated;
            });
        }
    };

    return (
        <>
            <section
                id="bookVehicle"
                className="min-h-screen w-full flex items-center justify-center px-4 py-8 sm:p-6 md:p-10 bg-gray-50 border-t-4 border-green-500"
            >
                <div className="w-full max-w-2xl mx-auto p-6 sm:p-8 bg-white rounded-xl shadow-2xl">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Book Your Shipment</h2>
                        <p className="mt-2 text-sm text-gray-600">Fill in the details to get a quote and book your vehicle.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Personal Details Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <InputField
                                    icon={<User size={16} />}
                                    type="text"
                                    placeholder="Your Name"
                                    {...register('name', { required: 'Name is required' })}
                                />
                                {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name.message}</span>}
                            </div>
                            <div>
                                <InputField
                                    icon={<Mail size={16} />}
                                    type="email"
                                    placeholder="Email Address"
                                    {...register('email', { required: 'Email is required' })}
                                />
                                {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>}
                            </div>
                        </div>
                        <div>
                            <InputField
                                icon={<Phone size={16} />}
                                type="text"
                                placeholder="Phone Number"
                                {...register('phone', { required: 'Phone number is required' })}
                            />
                            {errors.phone && <span className="text-red-500 text-xs mt-1">{errors.phone.message}</span>}
                        </div>


                        {/* Location Autocomplete Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Pickup Autocomplete */}
                            <div className="relative">
                                <InputField
                                    icon={<MapPin size={16} />}
                                    type="text"
                                    placeholder="Pick-up Location"
                                    value={pickupQuery}
                                    onChange={e => {
                                        setPickupQuery(e.target.value);
                                        setSelectedPickup(null);
                                    }}
                                />
                                {pickupSuggestions.length > 0 && (
                                    <ul className="absolute mt-1 bg-white border border-gray-200 w-full max-h-40 overflow-y-auto z-10 rounded-lg shadow-lg">
                                        {pickupSuggestions.map((s, i) => (
                                            <li
                                                key={i}
                                                className="p-3 text-sm hover:bg-green-50 cursor-pointer flex items-center gap-2"
                                                onClick={() => {
                                                    setSelectedPickup(s);
                                                    setPickupQuery(s.label);
                                                    setPickupSuggestions([]);
                                                }}
                                            >
                                                <MapPin size={14} className="text-gray-400" />
                                                {s.label}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {errors.pickup && <span className="text-red-500 text-xs mt-1">{errors.pickup.message}</span>}
                                <input type="hidden" {...register('pickup', { required: 'Pick-up location is required' })} />
                                <input type="hidden" {...register('pickupLat')} />
                                <input type="hidden" {...register('pickupLon')} />
                            </div>

                            {/* Dropoff Autocomplete */}
                            <div className="relative">
                                <InputField
                                    icon={<MapPin size={16} className="text-green-500" />}
                                    type="text"
                                    placeholder="Drop-off Location"
                                    value={dropoffQuery}
                                    onChange={e => {
                                        setDropoffQuery(e.target.value);
                                        setSelectedDropoff(null);
                                    }}
                                />
                                {dropoffSuggestions.length > 0 && (
                                    <ul className="absolute mt-1 bg-white border border-gray-200 w-full max-h-40 overflow-y-auto z-10 rounded-lg shadow-lg">
                                        {dropoffSuggestions.map((s, i) => (
                                            <li
                                                key={i}
                                                className="p-3 text-sm hover:bg-green-50 cursor-pointer flex items-center gap-2"
                                                onClick={() => {
                                                    setSelectedDropoff(s);
                                                    setDropoffQuery(s.label);
                                                    setDropoffSuggestions([]);
                                                }}
                                            >
                                                <MapPin size={14} className="text-gray-400" />
                                                {s.label}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {errors.dropoff && <span className="text-red-500 text-xs mt-1">{errors.dropoff.message}</span>}
                                <input type="hidden" {...register('dropoff', { required: 'Drop-off location is required' })} />
                                <input type="hidden" {...register('dropoffLat')} />
                                <input type="hidden" {...register('dropoffLon')} />
                            </div>
                        </div>

                        {/* Service and Price Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <Truck size={16} />
                                </span>
                                <select
                                    {...register('serviceType', { required: 'Service type is required' })}
                                    className="w-full appearance-none rounded-lg border border-gray-300 p-3 pl-10 text-sm shadow-sm transition focus:border-green-500 focus:ring-2 focus:ring-green-500/50"
                                >
                                    <option value="">Select Service Type</option>
                                    <option value="Intra-City">Intra-City Service</option>
                                    <option value="On-Demand">On-Demand Service</option>
                                </select>
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <ChevronsUpDown size={16} className="text-gray-400" />
                                </span>
                                {errors.serviceType && <span className="text-red-500 text-xs mt-1">{errors.serviceType.message}</span>}
                            </div>
                            <div>
                                <InputField
                                    icon={<CircleDollarSign size={16} />}
                                    type="number"
                                    placeholder="Your Bidding Price (INR)"
                                    {...register('offerPrice', { required: 'Bidding price is required' })}
                                />
                                {errors.offerPrice && <span className="text-red-500 text-xs mt-1">{errors.offerPrice.message}</span>}
                            </div>
                        </div>

                        {/* Additional Details Section */}
                        <div>
                            <div className="relative">
                                <span className="absolute top-3 left-0 flex items-center pl-3 text-gray-400">
                                    <Info size={16} />
                                </span>
                                <textarea
                                    placeholder="Additional Details (e.g., Vehicle Type, Preferred Time, etc.)"
                                    {...register('details')}
                                    rows={4}
                                    className="w-full rounded-lg border border-gray-300 p-3 pl-10 text-sm shadow-sm transition focus:border-green-500 focus:ring-2 focus:ring-green-500/50"
                                ></textarea>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full bg-green-600 mb-5 text-white py-3 px-5 rounded-lg font-semibold text-sm transition-all duration-300 ease-in-out hover:bg-green-700 hover:-translate-y-0.5 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Book Now & Get Quote
                        </button>
                    </form>


                    {/* Map View */}
                    {selectedPickup && selectedDropoff && (
                        <div className="col-span-full w-full h-64 mt-10 md:mt-0">
                            <MapView pickup={selectedPickup} destination={selectedDropoff} />
                            {distance && (
                                <p className="text-center mt-2 text-gray-600">
                                    Estimated Distance: {distance}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Driver Response Section */}
                    {driverResponse.map((resp, idx) => (
                        <div
                            key={resp.driverId || idx}
                            className="col-span-full flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm"
                        >
                            {/* === ACCEPTED STATUS === */}
                            {resp.status === 'accepted' && (
                                <>
                                    <p className="text-xl font-semibold text-green-600">
                                        Driver accepted your request! ✅
                                    </p>

                                    {/* For the button inside ConfirmRide, pass down primary button styles */}
                                    <ConfirmRide rideData={resp} onConfirm={() => handleConfirm(resp)} />

                                    <p className="text-sm text-gray-500">
                                        Please confirm within 10 seconds or this offer will expire.
                                    </p>
                                </>
                            )}

                            {/* === COUNTERED STATUS === */}
                            {resp.status === 'countered' && (
                                <>
                                    <div>
                                        <p className="text-xl font-semibold text-gray-800">
                                            Driver sent a <span className="text-amber-500">counter-offer</span>
                                        </p>
                                    </div>

                                    {/* Price details are grouped and styled for clarity */}
                                    <div className="rounded-md border bg-gray-50 p-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Original Offer</span>
                                            <span className="font-medium text-gray-800">${resp.offerPrice}</span>
                                        </div>
                                        <div className="my-2 border-t border-dashed"></div>
                                        <div className="flex justify-between text-base">
                                            <span className="font-semibold text-amber-600">New Price</span>
                                            <span className="font-bold text-amber-600">${resp.counterPrice}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Counter Offer Button */}
                                        <button
                                            onClick={() => {
                                                const userCounter = prompt("Enter your counter offer price:");
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
                                            className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                                        >
                                            Counter Again
                                        </button>

                                        <ConfirmRide rideData={resp} />
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {/* </div> */}
                </div>
            </section>
        </>

    );
}