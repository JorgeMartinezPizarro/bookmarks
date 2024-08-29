import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto-js'

export function middleware(req: NextRequest) {

  const PASSWORD = process.env.BOOKMARKS_PASSWORD || "";

  const cookieValue = req.cookies.get('cookieName')?.value;

  const expectedCookie = crypto.MD5(PASSWORD).toString()
  
  const url = req.nextUrl.clone();
  
  // Check for authentication and redirect if necessary
  if (cookieValue !== expectedCookie) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

// Apply middleware to specific paths
export const config = {
  matcher: ['/', '/api/'],
}