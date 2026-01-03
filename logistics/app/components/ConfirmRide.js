'use client';
import { BACKEND_URL } from '../../lib/backend';

export default function ConfirmRide({ rideData }) {
    const handleConfirm = async () => {
        const res = await fetch(`${BACKEND_URL}/api/rides/confirm`, {
        // const res = await fetch("https://logistics-hs8g.vercel.app/api/rides/confirm", {
        // const res = await fetch("https://logistics-zh4o.onrender.com/api/rides/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rideData),
        });
        const data = await res.json();
        if (res.ok) {
            alert("Ride confirmed and saved! Tracking Id: " + data.id);
        } else {
            alert("Error: " + data.error);
        }
    };

    return (

        <button onClick={handleConfirm}
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition duration-200"
        >
            Confirm Ride
        </button>
    );
}