"use client";
import RotatingText from "./components/RotatingText";
import CardPulseBorder from "./components/CardPulseBorder";
import ButtonBackgroundShine from "./components/ButtonBackgroundShine";
import InputPulseBorder from "./components/InputPulseBorder";
import BookingForm from "./components/BookingForm";
import WhatWeDo from "./components/WhatWeDo";
import Navbar from "./components/Navbar";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import Lottie from "lottie-react";
import carAnimation from "../public/Delivery.json";
import ContactPage from "./components/contactUs";

export default function Home() {
  const [trackingId, setTrackingId] = useState("");

  return (<>
    {/* initial home page */}
    <Navbar />
    <div className="flex flex-col items-center justify-center min-h-[90vh] text-center px-4"> {/* Added text-center and padding */}
      {/* Changed flex-row to flex-col on mobile, and adjusted font sizes */}
      <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-3 text-4xl sm:text-6xl font-bold">
        <span className="text-white">Smart</span>
        <RotatingText
          texts={['Logistics', 'Shipping', 'Solutions', 'Freight']}
          mainClassName="px-4 py-1 bg-green-400 text-black rounded-xl"
          staggerFrom={"last"}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-120%" }}
          staggerDuration={0.025}
          splitLevelClassName="overflow-hidden"
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          rotationInterval={2000}
        />
        {/* Adjusted font size and margin for mobile */}
        <span className="text-white text-3xl sm:text-6xl font-medium mt-2 sm:mt-0">— <i>Delivered</i> Your Way.</span>
      </div>
      <a href="#bookVehicle"><ButtonBackgroundShine className="mt-10 px-6 py-2 bg-green-300 text-black rounded-xl" label="Book Now" /></a>
    </div>

    {/* <div className="w-full h-0.5 bg-white my-5 opacity-1"></div> */}

    {/* Services Sections */}
    {/* Adjusted font size for mobile screens */}
    <section className="min-h-[20vh] text-center text-4xl md:text-7xl px-2">
      <span className="text-white font-bold p-2 md:p-10">Our Transportation <i className="font-bold text-yellow-500">Services</i></span>
    </section>
    <CardPulseBorder />

    {/* <div className="w-full h-0.5 bg-white my-5 opacity-1"></div> */}

    {/* Track Your Shipment */}
    {/* Adjusted font size and padding for mobile */}
    <section className="min-h-[20vh] text-center mt-10 mb-10 text-3xl md:text-5xl px-4">
      <span className="text-white font-bold p-2 md:p-10">Track Your <i className="font-bold text-yellow-500">Shipment</i> in Real-Time</span>
      <div className="flex-col justify-center mt-5 text-amber-50 text-base md:text-lg">
        <p>Stay updated with the latest information about your shipment&apos;s location and status.</p>
        {/* Changed to flex-col on mobile, stacking the input and button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-5 mx-auto max-w-md sm:max-w-none">
          <InputPulseBorder
            className="w-full max-w-md"
            trackingId={trackingId}
            setTrackingId={setTrackingId}
          />
          <Link href={`/trackShipment?id=${trackingId}`} className="w-full sm:w-auto">
            {/* Made button full-width on mobile */}
            <ButtonBackgroundShine className="whitespace-nowrap w-full sm:w-auto" label="Track" />
          </Link>
        </div>
      </div>
    </section>

    {/* <div className="w-full h-0.5 bg-white my-5 opacity-1"></div> */}

    {/* booking form */}
    <section id="bookVehicle" className="p-4 mt-28 md:p-8 z-50 bg-gray-50 border-t-4 border-green-500 min-h-screen flex justify-center">
      <div className="w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

        {/* Left Column: Text and Image */}
        <div className="flex flex-col justify-center items-center text-center space-y-4 px-4 md:px-8">
          <h3 className="text-4xl md:text-6xl font-bold">
            <span className="text-green-500 italic">Book </span>Your Vehicle
          </h3>
          <p className="text-gray-700 text-base md:text-lg max-w-md">
            Fill in the details below to book a vehicle for Intra-City or On-Demand service with real-time tracking.
          </p>
          {/* <Image src="/assets/book.jpg" alt="Booking illustration" width={400} height={400} className="rounded-lg" /> */}
          {/* <Image
            src="/assets/book.jpg"
            alt="Booking illustration"
            width={500}
            height={500}
            className="rounded-lg w-full max-w-md"
          /> */}
          <div className="w-full max-w-md">
            <Lottie animationData={carAnimation} loop={true} className="w-full h-full" />
          </div>
        </div>

        {/* Right Column: Booking Form */}
        <BookingForm />
      </div>
    </section>


    {/* what we do */}
    <div className="mt-16">
      <WhatWeDo />
    </div>

    <div>
        <ContactPage/>
    </div>
  </>
  );
}