import React from 'react';
import { Truck, Ship, BusFront } from 'lucide-react';

// --- Placeholder Components (as their definitions were not provided) ---
// You can replace these with your actual TextShine and ButtonBackgroundShine components.

const TextShine = ({ label, className }) => (
    <h3 className={`text-xl text-white ${className}`}>{label}</h3>
);

const ButtonBackgroundShine = ({ label, className }) => (
    <button className={className}>{label}</button>
);


// --- Reusable and Responsive Service Card Component ---

/**
 * A reusable, responsive card component for displaying services.
 * It adapts its width for mobile, tablet, and desktop screens.
 * @param {{
 * icon: React.ReactNode;
 * title: string;
 * description: string;
 * }} props
 */
const ServiceCard = ({ icon, title, description }) => (
    // Responsive width classes are key:
    // - w-full: Takes full width on mobile screens (default).
    // - md:w-[45%]: Takes 45% width on medium screens (tablets), allowing two cards per row.
    // - lg:w-[30%]: Takes 30% width on large screens (desktops) for a three-column layout.
    <div className="relative h-full w-full md:w-[45%] lg:w-[30%] flex flex-col">
        <div className="absolute top-0 flex w-full justify-center">
            {/* Animated top border effect */}
            <div className="h-[1px] animate-border-width rounded-full bg-gradient-to-r from-[rgba(17,17,17,0)] via-white to-[rgba(17,17,17,0)] transition-all duration-1000" />
        </div>
        <div className="flex h-full flex-col items-center justify-between rounded-md border border-gray-800 bg-gradient-to-b from-gray-950 to-black px-6 py-10 text-center">
            <div>
                {icon}
                <TextShine className="font-bold mt-2" label={title} />
                <p className="mt-3 text-gray-300 font-medium">
                    {description}
                </p>
            </div>
            <ButtonBackgroundShine 
                className="mt-6 rounded-md bg-green-400 px-5 py-2 text-black font-bold transition-all duration-300 hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/20" 
                label="Learn More" 
            />
        </div>
    </div>
);


// --- Main Container Component ---

// Data for the service cards is stored in an array for easy management.
const services = [
    {
        icon: <Truck className="text-blue-300 mb-5 mx-auto" size={50} />,
        title: "Intra-City Logistics",
        description: "Fast and reliable vehicle services for all your city-wide transportation needs."
    },
    {
        icon: <BusFront className="text-purple-300 mb-5 mx-auto" size={50} />,
        title: "On-Demand Rentals",
        description: "Flexible and affordable vehicle rentals, available whenever you need them, 24/7."
    },
    {
        icon: <Ship className="text-teal-300 mb-5 mx-auto" size={50} />,
        title: "Freight & Shipping",
        description: "Efficient and secure long-distance freight and shipping solutions for your business."
    }
];

/**
 * The main component that lays out the service cards in a responsive grid.
 */
const CardPulseBorder = () => {
    return (
        // The container uses flex-wrap and justify-center to handle different screen sizes gracefully.
        // `items-stretch` ensures all cards in a row are the same height.
        <div className="flex w-full flex-wrap items-stretch justify-center gap-8 py-16 px-4 bg-black">
            {services.map((service, index) => (
                <ServiceCard
                    key={index}
                    icon={service.icon}
                    title={service.title}
                    description={service.description}
                />
            ))}
        </div>
    );
};

export default CardPulseBorder;
