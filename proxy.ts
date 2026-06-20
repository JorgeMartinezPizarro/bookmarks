import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {

  if (process.env.NEXT_PUBLIC_ENABLE_LOGIN === "false") {
    return NextResponse.next();
  }

  console.log("Nextcloud auth middleware");

  const cookie = request.headers.get("cookie") || "";

  console.log("probando", process.env.NEXTCLOUD_URL);
  // 🔥 pedir identidad real a Nextcloud
  const res = await fetch(process.env.NEXTCLOUD_URL + "/ocs/v2.php/cloud/user", {
    headers: {
      cookie
    }
  });

  if (!res.ok) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const data = await res.json();

  if (!data?.ocs?.data?.id) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // usuario válido → continuar
  return NextResponse.next();
}

// cubrir solo app nextjs
export const config = {
  matcher: ['/pages/:path*']
};