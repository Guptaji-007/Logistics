import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const ride = await prisma.ride.findFirst({
      where: {
        driverVerificationCode: code,
        assignmentStatus: { in: ["assigned", "in_progress"] },
        completed: false
      }
    });

    if (!ride) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      ride
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}