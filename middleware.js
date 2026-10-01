// Simple password protection (HTTP Basic Auth) for the admin page and API.
// Set DM_USER and DM_PASS in .env.local. If DM_PASS is empty, auth is skipped (local dev only).
import { NextResponse } from 'next/server';

export function middleware(req) {
  const pass = process.env.DM_PASS;
  if (!pass) return NextResponse.next();
  const user = process.env.DM_USER || 'admin';

  const header = req.headers.get('authorization') || '';
  if (header.startsWith('Basic ')) {
    try {
      const [u, ...rest] = atob(header.slice(6)).split(':');
      if (u === user && rest.join(':') === pass) return NextResponse.next();
    } catch {}
  }
  return new NextResponse('Login required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Daily Manager"' },
  });
}

export const config = { matcher: ['/admin/:path*', '/api/daily-manager/:path*'] };
