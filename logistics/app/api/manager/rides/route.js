import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email'); // Manager's email

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    // Fetch rides where:
    // 1. This user is the 'driverId' (Manager who accepted the request)
    // 2. The ride is NOT completed
    // 3. Status is valid (e.g. not cancelled)
    const rides = await prisma.ride.findMany({
      where: {
        driverId: email, 
        completed: false,
        // Optionally filter out 'cancelled' if you have that status
      },
      include: {
        assignedDriver: true // Include sub-driver details if assigned
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ rides });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}