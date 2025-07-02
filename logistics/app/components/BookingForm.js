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


const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function BookingForm() {
    const { data: session } = useSession();
    const [driverResponse, setDriverResponses] = useState([]);
    const [activeJob, setActiveJob] = useState(null);
    const [timers, setTimers] = useState({}); // Track timers for each driver

    // Autocomplete states
    const [pickupQuery, setPickupQuery] = useState('');
    const [pickupSuggestions, setPickupSuggestions] = useState([]);
    const [selectedPickup, setSelectedPickup] = useState(null);

    const [dropoffQuery, setDropoffQuery] = useState('');
    const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
    const [selectedDropoff, setSelectedDropoff] = useState(null);

    const [distance, setDistance] = useState(null);
    const [justSelected, setJustSelected] = useState(false);


    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm();

    const socketRef = useRef();

    // Socket logic (unchanged)
    useEffect(() => {
        if (!session?.user?.email) return;
        socketRef.current = io("http://localhost:4000");
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

    const onSubmit = (data) => {
        // You can send pickup/dropoff coordinates as well
        socketRef.current.emit("ride_request", {
            ...data,
            userId: session?.user?.email,
            pickupLat: data.pickupLat,
            pickupLon: data.pickupLon,
            dropoffLat: data.dropoffLat,
            dropoffLon: data.dropoffLon,
        });
        reset();
        setSelectedPickup(null);
        setSelectedDropoff(null);
        setPickupQuery('');
        setDropoffQuery('');
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
            <section id="bookVehicle" className="min-h-screen min-w-5xl flex items-center justify-center p-10 bg-gray-50 border-t-4 border-green-500">
                <div className="max-w-9xl w-auto border-e-gray-50 rounded-xl shadow-md p-8 grid md:grid-cols-2 gap-10">
                    {/* Left Column */}
                    <div className="flex flex-col justify-center items-center space-y-4">
                        <h3 className="text-7xl font-bold mb-4">
                            <span className="text-green-500 italic">Book </span>Your Vehicle
                        </h3>
                        <p className="mb-4 text-gray-700">
                            Fill in the details below to book a vehicle for Intra-City or On-Demand service with real-time tracking.
                        </p>
                        <Image src="/assets/book.jpg" alt="Booking illustration" width={500} height={500} className="rounded-lg" />
                    </div>
                    <div className='flex flex-col justify-center items-center space-y-4 p-4 bg-gray-100 rounded-lg shadow-lg'>
                        {/* Right Column (Form) */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
                            <input type="text" placeholder="Your Name" {...register('name', { required: true })}
                                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                            {errors.name && <span className="text-red-500 text-sm">Name is required</span>}

                            <input type="email" placeholder="Email" {...register('email', { required: true })}
                                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                            {errors.email && <span className="text-red-500 text-sm">Email is required</span>}

                            <input type="text" placeholder="Phone Number" {...register('phone', { required: true })}
                                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                            {errors.phone && <span className="text-red-500 text-sm">Phone number is required</span>}

                            {/* Pickup Autocomplete */}
                            <div className="mb-2 relative">
                                <input
                                    type="text"
                                    placeholder="Pick-up Location"
                                    value={pickupQuery}
                                    onChange={e => {
                                        setPickupQuery(e.target.value);
                                        setSelectedPickup(null);
                                    }}
                                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                {pickupSuggestions.length > 0 && (
                                    <ul className="absolute bg-white border w-full max-h-40 overflow-y-auto z-10">
                                        {pickupSuggestions.map((s, i) => (
                                            <li
                                                key={i}
                                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => {
                                                    setSelectedPickup(s);
                                                    setPickupQuery(s.label);
                                                    setPickupSuggestions([]);
                                                    setJustSelected(true);
                                                }}
                                            >
                                                {s.label}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {errors.pickup && <span className="text-red-500 text-sm">Pick-up location is required</span>}
                            </div>
                            {/* Hidden fields for pickup coordinates */}
                            <input type="hidden" {...register('pickup', { required: true })} />
                            <input type="hidden" {...register('pickupLat')} />
                            <input type="hidden" {...register('pickupLon')} />

                            {/* Dropoff Autocomplete */}
                            <div className="mb-2 relative">
                                <input
                                    type="text"
                                    placeholder="Drop-off Location"
                                    value={dropoffQuery}
                                    onChange={e => {
                                        setDropoffQuery(e.target.value);
                                        setSelectedDropoff(null);
                                    }}
                                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                {dropoffSuggestions.length > 0 && (
                                    <ul className="absolute bg-white border w-full max-h-40 overflow-y-auto z-10">
                                        {dropoffSuggestions.map((s, i) => (
                                            <li
                                                key={i}
                                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => {
                                                    setSelectedDropoff(s);
                                                    setDropoffQuery(s.label);
                                                    setDropoffSuggestions([]);
                                                    setJustSelected(true);
                                                }}
                                            >
                                                {s.label}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {errors.dropoff && <span className="text-red-500 text-sm">Drop-off location is required</span>}
                            </div>
                            {/* Hidden fields for dropoff coordinates */}
                            <input type="hidden" {...register('dropoff', { required: true })} />
                            <input type="hidden" {...register('dropoffLat')} />
                            <input type="hidden" {...register('dropoffLon')} />

                            <select {...register('serviceType', { required: true })}
                                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                                <option value="">Select Service Type</option>
                                <option value="Intra-City">Intra-City Service</option>
                                <option value="On-Demand">On-Demand Service</option>
                            </select>
                            {errors.serviceType && <span className="text-red-500 text-sm">Service type is required</span>}

                            <input type="number" placeholder="Bidding Price" {...register('offerPrice', { required: true })}
                                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                            {errors.offerPrice && <span className="text-red-500 text-sm">Bidding price is required</span>}

                            <textarea placeholder="Additional Details (e.g., Vehicle Type, Time, etc.)"
                                {...register('details')} rows={5}
                                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>

                            <button
                                type="submit"
                                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition duration-200"
                            >
                                Book Now
                            </button>

                        </form>

                    </div>


                    {/* Map View */}
                    {selectedPickup && selectedDropoff && (
                        <div className="min-w-4xl h-50">
                            <MapView pickup={selectedPickup} destination={selectedDropoff} />
                            {distance && (
                                <p className="text-center mt-2 text-gray-600">Estimated Distance: {distance}</p>
                            )}
                        </div>
                    )}


                    {/* ...existing driver response rendering... */}
                    {driverResponse.map((resp, idx) => (
                        <div key={resp.driverId || idx} className="mb-4 p-4 border rounded">
                            {resp.status === "accepted" && (
                                <>
                                    <p>Driver accepted your request!</p>
                                    <ConfirmRide
                                        rideData={resp}
                                        onConfirm={() => handleConfirm(resp)}
                                    />
                                    <p className="text-red-500 text-sm mt-2">Please confirm within 10 seconds or this offer will expire.</p>
                                </>
                            )}
                            {resp.status === "countered" && (
                                <>
                                    <p className='text-2xl font-semibold'>Driver has <span className='text-green-500'>countered</span> your offer!</p>
                                    <p className='font-medium'>Original Offer Price: {resp.offerPrice}</p>
                                    <p className='font-medium'>Counter Offer Price: {resp.counterPrice}</p>
                                    <button
                                        onClick={() => {
                                            const userCounter = prompt("Enter your counter offer price:");
                                            if (userCounter) {
                                                socketRef.current.emit("user_counter_response", {
                                                    ...resp,
                                                    userId: session?.user?.email,
                                                    counterPrice: parseFloat(userCounter),
                                                    status: "user_countered",
                                                });
                                            }
                                        }}
                                        className="w-full bg-black text-white py-2 mt-1 mb-1 rounded hover:bg-blue-700 transition duration-200"
                                    >
                                        Counter Offer
                                    </button>
                                    <ConfirmRide rideData={resp} />
                                </>
                            )}

                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}