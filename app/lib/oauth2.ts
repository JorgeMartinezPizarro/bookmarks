import { AuthorizationCode } from 'simple-oauth2';

if (!process.env.NEXTCLOUD_CLIENT_ID || !process.env.NEXTCLOUD_CLIENT_SECRET) {
  throw new Error('Faltan variables de entorno para Nextcloud OAuth2');
}

// Puedes poner directamente el dominio sin depender de otra variable
const tokenHost = process.env.NEXTCLOUD_URL!;

const config = {
  client: {
    id: process.env.NEXTCLOUD_CLIENT_ID!,
    secret: process.env.NEXTCLOUD_CLIENT_SECRET!,
  },
  auth: {
    tokenHost,
    tokenPath: '/apps/oauth2/api/v1/token',
    authorizePath: '/apps/oauth2/authorize',
  },
};

export const client = new AuthorizationCode(config);