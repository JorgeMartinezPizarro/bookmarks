import type { NextAuthOptions } from "next-auth";
import { OAuthConfig } from "next-auth/providers/oauth";
import NextAuth from "next-auth";

const nextcloudProvider: OAuthConfig<any> = {
  id: "nextcloud",
  name: "Nextcloud",
  type: "oauth",
  clientId: process.env.NEXTCLOUD_CLIENT_ID!,
  clientSecret: process.env.NEXTCLOUD_CLIENT_SECRET!,
  authorization: `${process.env.NEXTCLOUD_URL}/index.php/apps/oauth2/authorize`,
  token: `${process.env.NEXTCLOUD_URL}/index.php/apps/oauth2/api/v1/token`,
  userinfo: `${process.env.NEXTCLOUD_URL}/ocs/v2.php/cloud/user?format=json`,
  async profile(_profile, tokens) {
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

    return { id: user.id, name: user.displayname, email: user.email };
  },
};

const authOptions: NextAuthOptions = {
  providers: [nextcloudProvider],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        if (account.refresh_token) token.refreshToken = account.refresh_token;

        // guardar info de usuario para session
        token.id = user?.id;
        token.name = user?.name;
        token.email = user?.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
      };
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
