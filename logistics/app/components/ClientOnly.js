'use client' // This is the most important part

import React from 'react';
import dynamic from 'next/dynamic';

// The dynamic import now lives inside a Client Component
const SmoothScroll = dynamic(
  () => import('./SmoothScroll'),
  { ssr: false }
);

export default function ClientOnly({ children }) {
  return (
    <SmoothScroll>
      {children}
    </SmoothScroll>
  );
}