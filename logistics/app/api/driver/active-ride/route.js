import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const driverEmail = searchParams.get('email');
  if (!driverEmail) {
    return NextResponse.json({ error: 'Driver email required' }, { status: 400 });
  }

  // Find the latest ride for this driver that is not completed
  const ride = await prisma.ride.findFirst({
    where: {
      driverId: driverEmail,
      completed: false,
    },
    orderBy: { confirmedAt: 'desc' },
  });

  return NextResponse.json(ride);
}

export async function PATCH(req) {
  const { searchParams } = new URL(req.url);
  const rideId = searchParams.get('rideId');
  if (!rideId) {
    return NextResponse.json({ error: 'Ride ID required' }, { status: 400 });
  }

  // Update the ride to mark it as completed
  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: { completed: true},
  });

  return NextResponse.json(updatedRide);
}