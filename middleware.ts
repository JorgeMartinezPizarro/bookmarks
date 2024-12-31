import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Endpoint de Nextcloud para validar la cookie
  const nextcloudUserInfoEndpoint = process.env.NEXT_PUBLIC_NEXTCLOUD_URL + '/ocs/v2.php/cloud/user';
  
  // Lee la cookie proporcionada por Nginx
  const cookie = request.cookies.get('nc_session_id')?.value;

  // Si no hay cookie, redirige inmediatamente al login
  if (!cookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Llamar al endpoint de Nextcloud
    const response = await fetch(nextcloudUserInfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${cookie}`,
        'OCS-APIREQUEST': 'true', // Header necesario para el API de Nextcloud
      },
    });

    // Verifica si el token es válido
    if (response.ok) {
      const userInfo = await response.json();

      // Si la respuesta contiene un usuario válido, permite continuar
      if (userInfo?.ocs?.data?.id) {
        return NextResponse.next();
      }
    }

    // Si el response no es OK o no tiene la información esperada, redirige al login
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    console.error('Error validando la cookie:', error);
    // En caso de error, redirige al login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Configuración para que el middleware se aplique en todas las rutas
export const config = {
  matcher: '/bookmarks/:path*', // Aplica el middleware a todas las rutas bajo /knowman
};
