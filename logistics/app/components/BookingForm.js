'use client';
import Image from 'next/image';

import { useForm } from 'react-hook-form';

export default function BookingForm() {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm();

    const onSubmit = async (data) => {
        try {
            const res = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const response = await res.json();
            alert(response.message);
            reset();
        } catch (err) {
            alert('Error submitting form');
        }
    };

    return (
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

                        <input type="text" placeholder="Pick-up Location" {...register('pickup', { required: true })}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                        {errors.pickup && <span className="text-red-500 text-sm">Pick-up location is required</span>}

                        <input type="text" placeholder="Drop-off Location" {...register('dropoff', { required: true })}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                        {errors.dropoff && <span className="text-red-500 text-sm">Drop-off location is required</span>}

                        <select {...register('serviceType', { required: true })}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="">Select Service Type</option>
                            <option value="Intra-City">Intra-City Service</option>
                            <option value="On-Demand">On-Demand Service</option>
                        </select>
                        {errors.serviceType && <span className="text-red-500 text-sm">Service type is required</span>}

                        <input type="number" placeholder="Bidding Price" {...register('initialPrice', { required: true })}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                        {errors.initialPrice && <span className="text-red-500 text-sm">Bidding price is required</span>}

                        <textarea placeholder="Additional Details (e.g., Vehicle Type, Time, etc.)"
                            {...register('details')} rows={5}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>

                        <button type="submit"
                            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition duration-200">
                            Book Now
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
