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