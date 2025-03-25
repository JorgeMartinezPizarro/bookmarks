import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Endpoint de Nextcloud para validar la cookie
  const nextcloudUserInfoEndpoint = process.env.NEXTCLOUD_URL + '/ocs/v2.php/cloud/user';
  
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
        Authorization: `Bearer ${cookie}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'OCS-APIREQUEST': 'true'
      },
    });

    // Verifica si el token es válido
    if (!response.ok) {
      throw new Error("Error: " + response.statusText + ". " + nextcloudUserInfoEndpoint)
      
    }
    
    const userInfo = await response.json();

    // Si la respuesta contiene un usuario válido, permite continuar
    if (!userInfo?.ocs?.data?.id) {
      throw new Error("No user load from nextcloud, error")
      
    }

    // No error happened, so continue
    return NextResponse.next();
  } catch (error) {
    console.error('Error validando la cookie:', error);
    // En caso de error, redirige al login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    //'/pages/monitor/:path*', 
    '/pages/games/:path',
    '/pages/code/:path',
    '/pages/paythering/:path',
    '/pages/trainer/:path',
  ]
};