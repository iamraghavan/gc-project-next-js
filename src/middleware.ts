import { NextResponse, type NextRequest } from 'next/server'

// This middleware is used to attach the user's auth token to server action requests
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-url', request.url);
  
  // Pass the authorization header from the client to the server
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    requestHeaders.set('Authorization', authHeader);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  // Match all request paths except for the ones starting with:
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  // It's important to not run middleware on static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
