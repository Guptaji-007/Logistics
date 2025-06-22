import Image from "next/image";
import ButtonBackgroundShine from "./ButtonBackgroundShine";
import TextShine from "./TextShine";
import { Truck, Ship, BusFront } from 'lucide-react';


const Card = () => (
    <div className="relative h-full w-[30%] mx-0">
        <div className="absolute top-0 flex w-full justify-center">
            <div className="h-[1px] animate-border-width rounded-full bg-gradient-to-r from-[rgba(17,17,17,0)] via-white to-[rgba(17,17,17,0)] transition-all duration-1000" />
        </div>
        <div className="flex h-full flex-col items-center justify-center rounded-md border border-gray-800 bg-gradient-to-b from-gray-950 to-black px-5 py-[50px] text-center">
            {/* <Image className='mt-0.5' src="/assets/image.png" alt='service' width={150} height={150} /> */}
            <Truck className="text-blue-200 mb-5" size={60} />
            <TextShine className="font-bold" label="Intra-City Services" />
            <p className="mt-2 text-gray-200 font-medium">
                Fast and reliable vehicle services for city-wide transportation.
            </p>
            <ButtonBackgroundShine className="mt-4 rounded-md bg-green-300 px-4 py-2 text-black font-bold hover:bg-[#c76013] transition" label="Book Now" />
        </div>
    </div>
);

const Card1 = () => (
    <div className="relative h-full w-[30%] mx-0">
        <div className="absolute top-0 flex w-full justify-center">
            <div className="h-[1px] animate-border-width rounded-full bg-gradient-to-r from-[rgba(17,17,17,0)] via-white to-[rgba(17,17,17,0)] transition-all duration-1000" />
        </div>
        <div className="flex h-full flex-col items-center justify-center rounded-md border border-gray-800 bg-gradient-to-b from-gray-950 to-black px-5 py-[50px] text-center">
            {/* <Image className='mt-0.5' src="/assets/on-demand.png" alt='service' width={115} height={115} /> */}
            <BusFront className="text-blue-200 mb-5" size={60} />

             <TextShine className="font-bold" label="Intra-City Services" />
            <p className="mt-2 text-gray-200 font-medium">
                Fast and reliable vehicle services for city-wide transportation.
            </p>
            <ButtonBackgroundShine className="mt-4 rounded-md bg-green-300 px-4 py-2 text-black font-bold hover:bg-[#c76013] transition" label="Book Now" />

        </div>
    </div>
);

const Card2 = () => (
    <div className="relative h-full w-[30%] mx-0">
        <div className="absolute top-0 flex w-full justify-center">
            <div className="h-[1px] animate-border-width rounded-full bg-gradient-to-r from-[rgba(17,17,17,0)] via-white to-[rgba(17,17,17,0)] transition-all duration-1000" />
        </div>
        <div className="flex h-full flex-col items-center justify-center rounded-md border border-gray-800 bg-gradient-to-b from-gray-950 to-black px-5 py-[50px] text-center">
            {/* <Image className='mt-0.5' src="/assets/freight.png" alt='service' width={130} height={130} /> */}
            <Ship className="text-blue-200 mb-5" size={60} />
             <TextShine className="font-bold" label="Intra-City Services" />
            <p className="mt-2 text-gray-200 font-medium">
                Fast and reliable vehicle services for city-wide transportation.
            </p>
            <ButtonBackgroundShine className="mt-4 rounded-md bg-green-300 px-4 py-2 text-black font-bold hover:bg-[#c76013] transition" label="Book Now" />

        </div>
    </div>
);


const CardPulseBorder = () => {
    return (
        <div className="flex w-full flex-wrap items-center justify-around gap-6 py-8">
            <Card />
            <Card1 />
            <Card2 />
        </div>
    );
};

export default CardPulseBorder;
