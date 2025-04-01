import { OAuthConfig } from "next-auth/providers/oauth";
import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";

interface NextcloudProfile {
  ocs: {
    data: {
      id: string;
      displayname: string;
      email: string;
    };
  };
}

const nextcloudProvider: OAuthConfig<any> = {
  id: "nextcloud",
  name: "Nextcloud",
  type: "oauth",
  clientId: process.env.NEXTCLOUD_CLIENT_ID!,
  clientSecret: process.env.NEXTCLOUD_CLIENT_SECRET!,
  authorization: `${process.env.NEXTCLOUD_URL}/index.php/apps/oauth2/authorize`,
  token: `${process.env.NEXTCLOUD_URL}/index.php/apps/oauth2/api/v1/token`,
  userinfo: `${process.env.NEXTCLOUD_URL}/ocs/v2.php/cloud/user?format=json`,
  profile(profile: NextcloudProfile) {
    return {
      id: profile.ocs.data.id,
      name: profile.ocs.data.displayname,
      email: profile.ocs.data.email,
    };
  },
};

export const authOptions: NextAuthOptions = {
  providers: [
    nextcloudProvider
  ],
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
