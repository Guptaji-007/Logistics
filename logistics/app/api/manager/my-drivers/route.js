import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const managerId = searchParams.get('managerId'); // This is the User.id of the manager

  // We actually need to find the User first based on email if managerId passed is email
  // Assuming session provides email. Let's handle email lookups.
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: "Manager email required" }, { status: 400 });
  }

  try {
    const manager = await prisma.user.findUnique({ where: { email } });
    if (!manager) return NextResponse.json({ error: "Manager not found" }, { status: 404 });

    const drivers = await prisma.manager_driver.findMany({
      where: { manager_id: manager.id },
      include: { driver: true }
    });

    return NextResponse.json({ drivers: drivers.map(d => d.driver) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}