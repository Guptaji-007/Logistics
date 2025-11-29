import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const data = await req.json();
    const {
      fullName,
      phone,
      email,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      experienceYears,
      address,
      managerId,
    } = data;

    if (
      !fullName ||
      !phone ||
      !email ||
      !vehicleType ||
      !vehicleNumber ||
      !licenseNumber ||
      !experienceYears ||
      !address ||
      !managerId
    ) {
      return new Response(JSON.stringify({ error: "All fields are required." }), { status: 400 });
    }

    const driver = await prisma.driver.create({
      data: {
        fullName,
        phone,
        email,
        vehicleType,
        vehicleNumber,
        licenseNumber,
        experienceYears: Number(experienceYears),
        address,
        isActive: false,
      },
    });

    await prisma.manager_driver.create({
      data: {
        manager_id: managerId,
        driver_id: driver.id,
      },
    });

    return new Response(JSON.stringify({ message: "Application submitted!", driver }), { status: 201 });
  } catch (error) {
    console.error("Error creating driver:", error);
    return new Response(JSON.stringify({ error: "Failed to submit application." }), { status: 500 });
  }
}