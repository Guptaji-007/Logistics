import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    // Fetch rides where manager is the driverId (negotiator) and ride is completed
    const rides = await prisma.ride.findMany({
      where: {
        driverId: email, 
        completed: true
      },
      include: {
        assignedDriver: true
      },
      orderBy: { createdAt: 'desc' }, // or completedAt if you added it
      take: 20
    });

    return NextResponse.json({ rides });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}