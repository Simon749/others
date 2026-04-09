import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

export default withAuth(async function middleware(req) {
  // This function is automatically wrapped in Kinde's logic
});

export const config = {
  // We explicitly target the folders that NEED protection
  matcher: [
    "/dashboard/:path*",
    "/api/dashboard/:path*"
  ],
};