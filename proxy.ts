import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET;

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret });
  console.log("Middleware in action!");
  // Si no hay token, redirigimos al login
  if (!token && process.env.NEXT_PUBLIC_ENABLE_LOGIN === "true") {
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
  matcher: ['/pages/:path*'], 
};
