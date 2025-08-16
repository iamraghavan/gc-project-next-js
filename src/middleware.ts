
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // This middleware is currently a placeholder.
  // The authentication logic is now handled by Firebase Callable functions and client-side SDKs.
  // We can add logic here in the future if needed.
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/drive/:path*',
}

    