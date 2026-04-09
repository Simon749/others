import { NextResponse } from 'next/server'
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function proxy(request) {
  const { isAuthenticated } = getKindeServerSession();
  
  // Note the () after isAuthenticated — we are calling the check!
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.redirect(
      new URL('/api/auth/login?post_login_redirect_url=/dashboard', request.url)
    );
  }
  
  return NextResponse.next();
}

export const config = {
  // We only want the proxy to touch the dashboard. 
  // Everything else (Login, Home, API) should be totally ignored.
  matcher: ['/dashboard/:path*'], 
}