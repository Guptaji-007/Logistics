"use client";

import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useSession } from 'next-auth/react';
import { Bell, MapPin, ArrowDownCircle, Copy, Check } from 'lucide-react';

const page = () => {
    const { data: session } = useSession();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null); // Track copied order id

    useEffect(() => {
        if (!session?.user?.email) return;
        setLoading(true);
        fetch(`/api/rides?userEmail=${encodeURIComponent(session.user.email)}`)
            .then(res => res.json())
            .then(data => {
                setOrders(data.rides || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [session]);

    if (!session) {
        return (
            <div>
                <Navbar />
                <div className="text-center mt-10 text-gray-600">Please log in to view your order history.</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div>
                <Navbar />
                <div className="text-center mt-10 text-gray-600">Loading your orders...</div>
            </div>
        );
    }

    const activeOrders = orders.filter(o => o.status === 'confirmed' && o.completed === false);
    const pastOrders = orders.filter(o => o.status === 'confirmed' && o.completed === true);

    // Pass copiedId and setCopiedId to OrderCard
    return (
        <>
            <Navbar />
            <div className="flex justify-between items-start mt-3 bg-white text-black px-7 py-5">
                <div>
                    <p className="text-2xl font-bold">Order History</p>
                    <p className="text-sm font-medium text-gray-500">Showing all your order history</p>
                </div>
                <div className="relative">
                    <Bell className="text-gray-500 cursor-pointer" />
                </div>
            </div>

            <div className="px-6 py-4 bg-gray-100 min-h-fit">
                {activeOrders.length > 0 && (
                    <>
                        <p className="text-lg font-semibold mb-3">Active orders</p>
                        {activeOrders.map(order => (
                            <OrderCard
                                key={order._id || order.id}
                                order={order}
                                copiedId={copiedId}
                                setCopiedId={setCopiedId}
                            />
                        ))}
                    </>
                )}

                {pastOrders.length > 0 && (
                    <>
                        <p className="text-lg font-semibold mt-6 mb-3">Past orders</p>
                        {pastOrders.map(order => (
                            <OrderCard
                                key={order._id || order.id}
                                order={order}
                                copiedId={copiedId}
                                setCopiedId={setCopiedId}
                            />
                        ))}
                    </>
                )}

                {orders.length === 0 && (
                    <div className="flex justify-center items-center h-64">
                        <p className="text-gray-500">No orders found.</p>
                    </div>
                )}
            </div>
        </>
    );
};

// Pass copiedId and setCopiedId as props
const OrderCard = ({ order, copiedId, setCopiedId }) => {
    const handleCopy = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(order.id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <div className="flex gap-3">
                <div className="flex flex-col items-center pt-1">
                    <ArrowDownCircle className="w-5 h-5 text-cyan-600" />
                    <div className="h-6 w-px bg-gray-300 my-1" />
                    <MapPin className="w-5 h-5 text-black" />
                </div>
                <div className="flex-1">
                    <p className="font-medium">{order.pickup}</p>
                    <p className="text-sm text-gray-500 mb-2">Pickup point</p>
                    <p className="font-medium">{order.drop || order.dropoff}</p>
                    <p className="text-sm text-gray-500">Destination</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                    <div className="text-xs mb-1 text-gray-500">Payment</div>
                    <div className="bg-green-100 text-green-600 text-sm font-medium px-2 rounded-lg">
                        {order.counterPrice ? `Offer Price: ₹${order.counterPrice}` : `Offer Price: ₹${order.offerPrice}`}
                    </div>
                    <div className="text-sm text-gray-500 mt-4">Order ID</div>
                    <div className="flex items-center gap-1">
                        <p className="font-medium">{order.id}</p>
                        <button
                            className="text-gray-400 hover:text-black transition-all"
                            onClick={() => handleCopy(order.id)}
                        >
                            {copiedId === order.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        {copiedId === order.id && <span className="text-sm text-green-600 ml-1">Copied</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default page;
