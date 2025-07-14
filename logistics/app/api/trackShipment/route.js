import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const trackingId = searchParams.get('trackingId');
  if (!trackingId) {
    return NextResponse.json({ error: 'Tracking ID is required' }, { status: 400 });
  }
  try {
    const ride = await prisma.ride.findUnique({
      where: { id: trackingId },
    });
    if (!ride) {
      return NextResponse.json({ error: 'No order found for this tracking ID' }, { status: 404 });
    }
    return NextResponse.json(ride);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}