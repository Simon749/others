import { NextResponse } from 'next/server'
import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";
// This function can be marked `async` if using `await` inside
export async function middlware(request) {
  const {isAuthenticated} = getKindeServerSession();
  if (!await isAuthenticated) {
    return NextResponse.redirect(new URL('/api/auth/login?post_login_redirect_url=/dashboard', request.url))
  }
  return NextResponse.next();
}
 
export const config = {
  matcher: '/dashboard/:path*',
}