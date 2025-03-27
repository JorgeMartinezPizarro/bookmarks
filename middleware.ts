import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL(process.env.NEXTAUTH_URL + '/login', request.url));
  }
}

export const config = {
  matcher: [
    '/pages/monitor/:path*', 
    '/pages/games/:path',
    '/pages/code/:path',
    '/pages/paythering/:path',
    '/pages/trainer/:path',
    
  ]
};