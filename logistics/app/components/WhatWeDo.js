'use client';

import { motion } from 'framer-motion';
import { Truck, MapPin, Clock, BadgeDollarSign } from 'lucide-react';

const features = [
  {
    icon: <Truck className="w-10 h-10 text-orange-500" />,
    title: 'On-Demand Vehicle Booking',
    desc: 'Book a vehicle instantly, wherever you are. No delays, no hassles.',
  },
  {
    icon: <MapPin className="w-10 h-10 text-orange-500" />,
    title: 'Intra-City Logistics',
    desc: 'Need something moved across town? We’ve got you covered.',
  },
  {
    icon: <Clock className="w-10 h-10 text-orange-500" />,
    title: 'Live GPS Tracking',
    desc: 'Track your vehicle or package in real-time from pickup to delivery.',
  },
  {
    icon: <BadgeDollarSign className="w-10 h-10 text-orange-500" />,
    title: 'Transparent Bidding System',
    desc: 'Set your price and choose the best match — no hidden fees.',
  },
];

export default function WhatWeDo() {
  return (
    <section className="py-20 bg-gray-50" id="what-we-do">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-12">How We Help You Move</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white shadow-xl p-6 rounded-lg"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <div className="flex justify-center mb-4">{feature.icon}</div>
              <h4 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h4>
              <p className="text-gray-600">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
