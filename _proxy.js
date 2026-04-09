import { NextResponse } from 'next/server'
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function proxy(request) {
  const { isAuthenticated } = getKindeServerSession();
  
  // Use a try-catch to prevent a hang if Kinde is down
  try {
    const isUserAuthenticated = await isAuthenticated();

    if (!isUserAuthenticated) {
      // Direct the user to login, but only if they aren't ALREADY on a public page
      return NextResponse.redirect(
        new URL('/api/auth/login?post_login_redirect_url=/dashboard', request.url)
      );
    }
  } catch (error) {
    console.error("Middleware Auth Error:", error);
    // If auth check fails, don't loop—just let them through and handle it on the page
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (IMPORTANT: This prevents the auth loop!)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // Alternatively, just use: '/dashboard/:path*' if you ONLY want to protect the dashboard
  ],
}