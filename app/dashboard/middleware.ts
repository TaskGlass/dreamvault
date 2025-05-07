import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  try {
    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Middleware auth error:", error.message)
    }

    // If no session, redirect to login
    if (!session) {
      console.log("No session found, redirecting to login")
      const redirectUrl = new URL("/login", req.nextUrl.origin)
      // Add the original URL as a query parameter to redirect back after login
      redirectUrl.searchParams.set("redirect", req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (err) {
    console.error("Middleware error:", err)
    // In case of error, redirect to login as a fallback
    const redirectUrl = new URL("/login", req.nextUrl.origin)
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
