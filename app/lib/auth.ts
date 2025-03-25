import { NextRequest, NextResponse } from 'next/server';

type UserInfo = {
  id: string;
  displayName: string;
  email?: string;
  [key: string]: any;
};

export async function requireAuth(request: NextRequest): Promise<UserInfo> {
  const cookie = request.cookies.get('nc_session_id')?.value;

  
  if (!cookie) {
    throw new Error('No autorizado: falta cookie');
  }

  const endpoint = process.env.NEXTCLOUD_URL + '/ocs/v2.php/cloud/user';

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${cookie}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'OCS-APIREQUEST': 'true',
    },
  });

  if (!response.ok) {
    throw new Error('No autorizado: sesión inválida');
  }

  const data = await response.json();
  const user = data?.ocs?.data;

  if (!user?.id) {
    throw new Error('No autorizado: datos de usuario inválidos');
  }

  return user;
}
