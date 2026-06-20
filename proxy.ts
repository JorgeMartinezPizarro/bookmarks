import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET;

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret });

  console.log("Middleware in action!");

  // 1. No token -> redirect inmediato
  if (!token) {
    return NextResponse.redirect(new URL('/bookmarks', request.url));
  }

  // 2. Token existe pero expirado -> intentar refresh
  const now = Math.floor(Date.now() / 1000);

  const expired =
    token?.accessTokenExpires &&
    typeof token.accessTokenExpires === "number" &&
    token.accessTokenExpires < now;

  if (expired) {
    try {
      const refreshRes = await fetch(`${request.nextUrl.origin}/api/auth/refresh`, {
        method: "POST",
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      });

      if (!refreshRes.ok) {
        throw new Error("refresh failed");
      }

      const data = await refreshRes.json();

      if (!data?.accessToken) {
        throw new Error("invalid refresh response");
      }

      // refresh OK -> continuar request
      return NextResponse.next();
    } catch (e) {
      console.log("Refresh failed, redirecting...");
      return NextResponse.redirect(new URL('/bookmarks', request.url));
    }
  }

  // 3. Token válido
  return NextResponse.next();
}

// IMPORTANTE: asegúrate de cubrir todo lo protegido
export const config = {
  matcher: ['/pages/:path*'],
};