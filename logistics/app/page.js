import Image from "next/image";
import RotatingText from "./components/RotatingText";
import CardPulseBorder from "./components/CardPulseBorder";
import ButtonBackgroundShine from "./components/ButtonBackgroundShine";

export default function Home() {
  return (<>
    {/* initial home page */}
    <div className="flex flex-col items-center justify-center min-h-[90vh] ">
      <div className="flex flex-row items-center space-x-3 sm:text-6xl font-bold">
        <span className="text-white">Smart</span>
        <RotatingText
          texts={['Logistics', 'Shipping', 'Solutions', 'Freight']}
          mainClassName="px-4 py-1 bg-green-300 text-black rounded-xl"
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
      {/* <button className=""><b>Book Your Vehicle</b></button> */}
      <ButtonBackgroundShine className="mt-10 px-6 py-2 bg-green-300 text-black rounded-xl" label="Book Now" />
      {/* <ButtonBackgroundShine label="Loading..." disabled /> */}

    </div>

    {/* Services Sections */}
    <section className=" min-h-[20vh] text-center mt-10 mb-10 text-7xl">
      <span className="text-white font-bold  p-10">Our Transportation <i className="font-bold text-green-400">Services</i></span>
    </section>
    <CardPulseBorder/>


    {/* Track Your Shipment */}

  </>
  );
}
