import Image from "next/image";
import RotatingText from "./components/RotatingText";
import CardPulseBorder from "./components/CardPulseBorder";
import ButtonBackgroundShine from "./components/ButtonBackgroundShine";
import InputPulseBorder from "./components/InputPulseBorder";
import BookingForm from "./components/BookingForm";
import WhatWeDo from "./components/WhatWeDo";
import Navbar from "./components/Navbar";

export default function Home() {
  return (<>
    {/* initial home page */}
    <Navbar/>
    <div className="flex flex-col items-center justify-center min-h-[90vh] ">
      <div className="flex flex-row items-center space-x-3 sm:text-6xl font-bold">
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
        <span className="text-white sm:text-6xl font-medium">— <i>Delivered</i> Your Way.</span>
      </div>
      <ButtonBackgroundShine className="mt-10 px-6 py-2 bg-green-300 text-black rounded-xl" label="Book Now" />
      {/* <ButtonBackgroundShine label="Loading..." disabled /> */}
    </div>

    <div className="w-full h-0.5 bg-white my-5"></div>

    {/* Services Sections */}
    <section className="min-h-[20vh] text-center mt-30 mb-10 text-7xl">
      <span className="text-white font-bold  p-10">Our Transportation <i className="font-bold text-blue-400">Services</i></span>
    </section>
    <CardPulseBorder/>

    <div className="w-full h-0.5 bg-white my-5"></div>



    {/* Track Your Shipment */}
    <section className="min-h-[20vh] text-center mt-30 mb-10 text-5xl ">
      <span className="text-white font-bold  p-10">Track Your <i className="font-bold text-blue-400">Shipment</i> in Real-Time</span>
      <div className="flex-col justify-center mt-5 text-amber-50 text-lg">
        <p>Stay updated with the latest information about your shipment's location and status.</p>
        <div className="flex items-center justify-center gap-2 mt-5  mx-auto">
          <InputPulseBorder className="mt-6 w-full max-w-md" />
          <ButtonBackgroundShine className="whitespace-nowrap" label="Track" />
        </div>
      </div>
    </section>

    {/* booking form */}
    <section id="bookVehicle" className="p-8 z-50">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-start cursor-none">
        {/* Booking Form Component */}
        <BookingForm />
      </div>
    </section>

    {/* <div className="w-ffdjkfdull h-0.5 bg-white my-5"></div> */}

    {/*what we do*/}
    <div className="mt-16">
    <WhatWeDo/>
    </div>
  </>
  );
}
