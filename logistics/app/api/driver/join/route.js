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
    } = data;

    if (
      !fullName ||
      !phone ||
      !email ||
      !vehicleType ||
      !vehicleNumber ||
      !licenseNumber ||
      !experienceYears ||
      !address
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
      },
    });

    return new Response(JSON.stringify({ message: "Application submitted!", driver }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to submit application." }), { status: 500 });
  }
}