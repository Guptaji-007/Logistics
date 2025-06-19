import nodemailer from "nodemailer";

export async function sendMail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
  try {
    console.log("email sent to", to);
  } catch (error) {
    console.error("Failed to send email");
    throw new Error("Failed to send email");
  }
}