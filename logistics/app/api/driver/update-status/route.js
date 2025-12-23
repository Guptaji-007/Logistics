import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const { rideId, status } = await req.json(); // status: 'in_progress' or 'completed'

    if (!rideId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updateData = {
      assignmentStatus: status
    };

    if (status === 'completed') {
      updateData.completed = true;
      // We assume your schema might not have completedAt, so we skip it or you need to add it to schema.prisma
      // updateData.completedAt = new Date(); 
    }

    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: updateData
    });

    return NextResponse.json({ success: true, ride: updatedRide });
  } catch (error) {
    console.error("Update Status Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}