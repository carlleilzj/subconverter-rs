import { NextRequest, NextResponse } from 'next/server';

// Only admin APIs require token. Conversion must stay usable from the UI
// and from subscription clients; protecting /api/sub with a server-only
// token broke the homepage because the frontend never sends it.
const TOKEN_PROTECTED_PREFIXES = ['/api/admin'];

function hasValidToken(request: NextRequest, apiToken: string): boolean {
  const queryToken = request.nextUrl.searchParams.get('token');
  if (queryToken && queryToken === apiToken) {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7) === apiToken;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  const headers = response.headers;

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  const apiToken = process.env.API_ACCESS_TOKEN;
  if (
    apiToken &&
    TOKEN_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    if (!hasValidToken(request, apiToken)) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Valid token required' },
        { status: 401 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
