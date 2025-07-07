import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const driver_email = searchParams.get('driver_email'); // Use email as key
    if (!driver_email) {
        return NextResponse.json({ error: 'Driver email is required' }, { status: 400 });
    }

    try {
        // Use a raw query to extract lat/lon from the geography POINT
        const [location] = await prisma.$queryRaw`
            SELECT
                ST_Y(location::geometry) AS latitude,
                ST_X(location::geometry) AS longitude
            FROM "driver_locations"
            WHERE driver_email = ${driver_email}
            LIMIT 1
        `;
        if (!location) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 });
        }
        return NextResponse.json({ location });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    const { searchParams } = new URL(req.url);
    const driver_email = searchParams.get('driver_email');
    if (!driver_email) {
        return NextResponse.json({ error: 'Driver email is required' }, { status: 400 });
    }

    try {
        const { location } = await req.json();
        const { latitude, longitude } = location || {};
        if (!latitude || !longitude) {
            return NextResponse.json({ error: 'Invalid location data' }, { status: 400 });
        }

        // Use PostGIS function ST_SetSRID and ST_MakePoint to construct a geography POINT
        await prisma.$executeRaw`
            INSERT INTO "driver_locations" (driver_email, location, updated_at)
            VALUES (
                ${driver_email},
                ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
                NOW()
            )
            ON CONFLICT (driver_email)
            DO UPDATE SET 
                location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
                updated_at = NOW();
        `;

        return NextResponse.json({ success: true, message: 'Location updated successfully' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
