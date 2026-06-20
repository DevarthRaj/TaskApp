import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { nextUrl } = req

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
  const isPublicRoute = ["/login", "/register"].includes(nextUrl.pathname)

  if (isApiAuthRoute) {
    return
  }

  if (isPublicRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/", nextUrl))
    }
    return
  }

  if (!isLoggedIn) {
    if (nextUrl.pathname.startsWith("/api/")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    return Response.redirect(new URL("/login", nextUrl))
  }

  return
})

export const config = {
  // Match all request paths except api/auth, _next/static, _next/image, favicon.ico
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
