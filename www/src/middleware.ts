import { NextRequest, NextResponse } from 'next/server';

// Security-critical routes that require API token
const PROTECTED_API_PATHS = ['/api/sub', '/api/admin', '/api/init'];
const PUBLIC_API_PATHS = ['/api/downloads'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ======== Security Headers ========
  const headers = response.headers;

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');
  // Enable XSS filter in older browsers
  headers.set('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions policy (limit what browser features can be used)
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // ======== API Token Protection ========
  const apiToken = process.env.API_ACCESS_TOKEN;

  if (apiToken && PROTECTED_API_PATHS.some(p => pathname.startsWith(p))) {
    const token = request.nextUrl.searchParams.get('token');

    if (!token || token !== apiToken) {
      // Check Authorization header as fallback
      const authHeader = request.headers.get('authorization');
      const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

      if (!bearerToken || bearerToken !== apiToken) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Valid token required' },
          { status: 401 }
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Apply to API routes and pages
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
