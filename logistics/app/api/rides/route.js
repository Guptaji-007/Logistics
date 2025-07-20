import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userEmail = searchParams.get('userEmail'); 
    if (!userEmail) {
        return NextResponse.json({ error: 'User email required' }, { status: 400 });
    }

    try {
        const rides = await prisma.ride.findMany({
            where: { userId: userEmail },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ rides });
  } catch (error) {
    return NextResponse.json({ rides: [], error: error.message }, { status: 500 });
  }
};

