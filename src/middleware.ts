import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname.toLowerCase();

  // Normalize common truck management paths to /manage-trucks
  if (
    pathname === '/manage-truck' ||
    pathname === '/admin/manage-truck' ||
    pathname === '/admin/manage-trucks'
  ) {
    url.pathname = '/manage-trucks';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/manage-truck/:path*',
    '/admin/manage-truck/:path*',
    '/admin/manage-trucks/:path*',
  ],
};


