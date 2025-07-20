"use client";

import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useSession } from 'next-auth/react';
import { Bell, MapPin, ArrowDownCircle, Copy, Check } from 'lucide-react';

// A responsive card component to display order details.
const OrderCard = ({ order, copiedId, setCopiedId }) => {
    const handleCopy = (text) => {
        // Uses navigator.clipboard to copy text, a modern and secure approach.
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(order.id);
            setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            {/* Responsive container: 
              - Stacks vertically on small screens (`flex-col`).
              - Becomes a row on screens medium and up (`sm:flex-row`).
            */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                
                {/* Left Section: Contains icons and location details */}
                <div className="flex gap-4 w-full sm:w-auto">
                    {/* Icons for pickup and destination */}
                    <div className="flex flex-col items-center pt-1">
                        <ArrowDownCircle className="w-5 h-5 text-cyan-600" />
                        <div className="h-10 w-px bg-gray-300 my-1" />
                        <MapPin className="w-5 h-5 text-black" />
                    </div>
                    {/* Location text */}
                    <div className="flex-1">
                        <p className="font-medium text-black">{order.pickup}</p>
                        <p className="text-sm text-gray-500 mb-2">Pickup point</p>
                        <p className="font-medium text-black">{order.drop || order.dropoff}</p>
                        <p className="text-sm text-gray-500">Destination</p>
                    </div>
                </div>

                {/* Right Section: Contains payment and order ID */}
                {/* On mobile, this section gets a top border for clear separation */}
                <div className="flex flex-col items-start sm:items-end w-full sm:w-auto border-t border-gray-100 sm:border-t-0 pt-4 sm:pt-0 pl-1 sm:pl-0">
                    <div className="text-xs mb-1 text-gray-500">Payment</div>
                    <div className="bg-green-100 text-green-600 text-sm font-medium px-2 py-1 rounded-lg mb-4">
                        {order.counterPrice ? `Offer Price: ₹${order.counterPrice}` : `Offer Price: ₹${order.offerPrice}`}
                    </div>
                    <div className="text-sm text-gray-500">Order ID</div>
                    <div className="flex items-center gap-1">
                        <p className="font-medium text-black">{order.id}</p>
                        <button
                            aria-label="Copy order ID"
                            className="text-gray-400 hover:text-black transition-all"
                            onClick={() => handleCopy(order.id)}
                        >
                            {copiedId === order.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        {copiedId === order.id && <span className="text-xs text-green-600 ml-1">Copied!</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};


const OrderHistoryPage = () => {
    const { data: session } = useSession();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        if (!session?.user?.email) return;
        setLoading(true);
        fetch(`/api/rides?userEmail=${encodeURIComponent(session.user.email)}`)
            .then(res => res.json())
            .then(data => {
                setOrders(data.rides || []);
                setLoading(false);
            })
            .catch(() => {
                console.error("Failed to fetch orders.");
                setLoading(false);
            });
    }, [session]);

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="text-center mt-20 text-gray-600">Loading your orders...</div>
            </>
        );
    }
    
    if (!session) {
        return (
            <>
                <Navbar />
                <div className="text-center mt-20 text-gray-600">Please log in to view your order history.</div>
            </>
        );
    }

    const activeOrders = orders.filter(o => o.status === 'confirmed' && o.completed === false);
    const pastOrders = orders.filter(o => o.status === 'confirmed' && o.completed === true);

    return (
        <>
            <Navbar />
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-5">
                        <div>
                            <p className="text-2xl font-bold text-black">Order History</p>
                            <p className="text-sm font-medium text-gray-500">Review your active and past orders</p>
                        </div>
                        <div className="relative">
                            <Bell className="text-gray-500 cursor-pointer" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Section */}
            <div className="bg-gray-50 min-h-screen">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {activeOrders.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold mb-3 text-black">Active orders</h2>
                            {activeOrders.map(order => (
                                <OrderCard
                                    key={order._id || order.id}
                                    order={order}
                                    copiedId={copiedId}
                                    setCopiedId={setCopiedId}
                                />
                            ))}
                        </section>
                    )}

                    {pastOrders.length > 0 && (
                        <section className="mt-8">
                            <h2 className="text-lg font-semibold mb-3 text-black">Past orders</h2>
                            {pastOrders.map(order => (
                                <OrderCard
                                    key={order._id || order.id}
                                    order={order}
                                    copiedId={copiedId}
                                    setCopiedId={setCopiedId}
                                />
                            ))}
                        </section>
                    )}

                    {orders.length === 0 && (
                        <div className="flex justify-center items-center h-64 rounded-lg">
                            <p className="text-gray-500">You have no orders yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default OrderHistoryPage;
