import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const { rideId, managerEmail, driverId } = await req.json();

    if (!rideId || !managerEmail || !driverId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate a unique 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Verify the manager owns this ride (optional but good security)
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride || ride.driverId !== managerEmail) {
       // Note: ride.driverId is the manager's email in the current schema logic
       return NextResponse.json({ error: "Unauthorized or Ride not found" }, { status: 403 });
    }

    // Update the Ride with assignment
    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: {
        managerId: managerEmail,
        assignedDriverId: driverId,
        driverVerificationCode: verificationCode,
        assignmentStatus: "assigned",
        isDriverVerified: false
      }
    });

    return NextResponse.json({ 
      success: true, 
      ride: updatedRide,
      code: verificationCode 
    });

  } catch (error) {
    console.error("Assign Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}