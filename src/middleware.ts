// Middleware temporarily disabled to fix API route issues
// This will be re-enabled once the booking functionality is working

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Let everything pass through for now
  return NextResponse.next();
}

export const config = {
  matcher: [],
};


