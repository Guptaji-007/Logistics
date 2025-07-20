import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_PATH = "/admin";
const ADMIN_ROLE = "admin";

export async function middleware(request) {
  // Only run middleware for /admin routes
  if (request.nextUrl.pathname.startsWith(ADMIN_PATH)) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== ADMIN_ROLE) {
      // Redirect to login or show 403
      return NextResponse.redirect(new URL("/login", request.url));
      // Or for 403:
      // return new NextResponse("Forbidden", { status: 403 });
    }
  }
  return NextResponse.next();
}

// Limit middleware to /admin routes only
export const config = {
  matcher: ["/admin/:path*"],
};