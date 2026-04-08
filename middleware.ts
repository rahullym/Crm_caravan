import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  // Protect all routes strictly, except for auth endpoints, static files, and the webhook
  matcher: [
    "/((?!api/auth|api/meta/webhook|login|_next/static|_next/image|favicon.ico).*)",
  ],
}
