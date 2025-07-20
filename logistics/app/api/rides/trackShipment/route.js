import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const trackingId = searchParams.get('trackingId');
  if (!trackingId) {
    return NextResponse.json({ error: 'Tracking ID required' }, { status: 400 });
  }

  try {
    const ride = await prisma.ride.findUnique({
      where: { id: trackingId },
    });
    return NextResponse.json({ ride });
  } catch (error) {
    return NextResponse.json({ ride: null, error: error.message }, { status: 500 });
  }
};