import prisma from "@/lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) {
    return new Response(JSON.stringify({ error: "Email required" }), { status: 400 });
  }
//   const driver = await prisma.driver.findUnique({ where: { email } });
    const driver = await prisma.driver.findUnique({ where: { email } });
  if (!driver) {
    return new Response(JSON.stringify({ error: "Driver not found" }), { status: 404 });
  }
  return new Response(JSON.stringify(driver), { status: 200 });
}