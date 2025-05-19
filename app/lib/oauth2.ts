// lib/oauth2.ts
import { AuthorizationCode } from 'simple-oauth2';

const config = {
  client: {
    id: process.env.NEXTCLOUD_CLIENT_ID!,
    secret: process.env.NEXTCLOUD_CLIENT_SECRET!,
  },
  auth: {
    tokenHost: process.env.NEXTCLOUD_URL!,
    tokenPath: '/apps/oauth2/api/v1/token',
    authorizePath: '/apps/oauth2/authorize',
  },
};

export const client = new AuthorizationCode(config);