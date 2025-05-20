import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret });

  // Si no hay token, redirigimos al login
  if (!token) {
    const loginUrl = new URL('/bookmarks/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url); // opcional
    return NextResponse.redirect(loginUrl);
  }

  // Si hay sesión, dejamos pasar
  return NextResponse.next();
}

// Configuración para que el middleware se aplique en todas las rutas
// TODO: usar ruta real y nextcloud configurado en .env.
export const config = {
  matcher: ['/bookmarks/pages:path*'], 
};
