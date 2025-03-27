import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import { OAuthConfig } from "next-auth/providers";

const nextcloudProvider: OAuthConfig<any> = {
  id: "nextcloud",
  name: "Nextcloud",
  type: "oauth",
  version: "2.0",
  clientId: process.env.NEXTCLOUD_CLIENT_ID!,
  clientSecret: process.env.NEXTCLOUD_CLIENT_SECRET!,
  authorization: {
    url: "https://cloud.example.com/apps/oauth2/authorize",
    params: { scope: "openid profile email" },
  },
  token: "https://cloud.example.com/apps/oauth2/api/v1/token",
  userinfo: "https://cloud.example.com/ocs/v2.php/cloud/user?format=json",
  profile(profile: any) {
    return {
      id: profile.ocs.data.id,
      name: profile.ocs.data.displayname,
      email: profile.ocs.data.email,
      image: null,
    };
  },
  checks: ["pkce", "state"],
};

export const authOptions: NextAuthOptions = {
  providers: [nextcloudProvider],
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/login", // opcional
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
