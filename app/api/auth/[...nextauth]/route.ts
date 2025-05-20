import type { NextAuthOptions } from "next-auth";
import { OAuthConfig } from "next-auth/providers/oauth";

const nextcloudProvider: OAuthConfig<any> = {
  id: "nextcloud",
  name: "Nextcloud",
  type: "oauth",
  clientId: process.env.NEXTCLOUD_CLIENT_ID!,
  clientSecret: process.env.NEXTCLOUD_CLIENT_SECRET!,
  authorization: `${process.env.NEXTCLOUD_URL}/index.php/apps/oauth2/authorize`,
  token: `${process.env.NEXTCLOUD_URL}/index.php/apps/oauth2/api/v1/token`,
  userinfo: `${process.env.NEXTCLOUD_URL}/ocs/v2.php/cloud/user?format=json`, // ← esto lo hace feliz
  async profile(_profile, tokens) {
    try {
      const res = await fetch(`${process.env.NEXTCLOUD_URL}/ocs/v2.php/cloud/user?format=json`, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: "application/json",
          "OCS-APIRequest": "true",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch user info");

      const json = await res.json();
      const user = json?.ocs?.data;

      return {
        id: user.id,
        name: user.displayname,
        email: user.email,
      };
    } catch (err) {
      console.error("[Nextcloud Profile Error]", err);
      throw new Error("Nextcloud profile() failed");
    }
  },
};

import NextAuth from "next-auth";
// 🛡️ Configuración principal de NextAuth
const authOptions: NextAuthOptions = {
  providers: [nextcloudProvider],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
