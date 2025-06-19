import prisma from "@/lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  if (!token || !email) {
    return new Response("Invalid link", { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.resetToken !== token || !user.resetExpires || user.resetExpires < new Date()) {
    return new Response("Invalid or expired token", { status: 400 });
  }

  await prisma.user.update({
    where: { email },
    data: {
      emailVerified: new Date(),
      resetToken: null,
      resetExpires: null,
    },
  });

  // Optionally redirect to login page with a success message
  return new Response("Email verified! You can now log in.", { status: 200 });
}