import prisma from "@/lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) {
    return new Response(JSON.stringify({ error: "Email required" }), { status: 400 });
  }

  const driver = await prisma.driver.findUnique({ where: { email } });
  if (!driver) {
    return new Response(JSON.stringify({ error: "Driver not found" }), { status: 404 });
  }

  return new Response(JSON.stringify(driver), { status: 200 });
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { email, isActive } = body;

    if (!email || typeof isActive !== "boolean") {
      return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
    }

    const updatedDriver = await prisma.driver.update({
      where: { email },
      data: { isActive },
    });

    return new Response(JSON.stringify(updatedDriver), { status: 200 });
  } catch (error) {
    console.error("Error updating isActive:", error);
    return new Response(JSON.stringify({ error: "Failed to update status" }), { status: 500 });
  }
}
