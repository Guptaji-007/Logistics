import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { sendMail } from "@/lib/email";
import crypto from "crypto";

const VERIFICATION_TOKEN_EXPIRY_MINUTES = 60;

export async function POST(req) {
  try {
    const { email, password, usertype } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password required" }), { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return new Response(JSON.stringify({ error: "User already exists" }), { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email,
        role: usertype || "user", // default to 'user' if not provided
        password: hashed,
        resetToken: token,
        resetExpires: expires,
      },
    });
    // const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    // await sendMail({
    //   to: email,
    //   subject: "Verify your email",
    //   html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email. This link expires in ${VERIFICATION_TOKEN_EXPIRY_MINUTES} minutes.</p>`,
    // });

    return new Response(JSON.stringify({ id: user.id, email: user.email }), { status: 201 });
  } catch (e) {
    console.log(e)
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
