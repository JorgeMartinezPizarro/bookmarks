// route.ts (o nextauth.ts para Pages Router)
import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import type { OAuthConfig } from "next-auth/providers/oauth";

// -------------------------------
// Nextcloud OAuth Provider Config
// -------------------------------
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
    const res = await fetch(
      `${process.env.NEXTCLOUD_URL}/ocs/v2.php/cloud/user?format=json`,
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: "application/json",
          "OCS-APIRequest": "true",
        },
      }
    );

    if (!res.ok) throw new Error("Failed to fetch user info");
    const json = await res.json();
    const user = json?.ocs?.data;

    return {
      id: user.id,
      name: user.displayname,
      email: user.email,
    };
  },
};

// -----------------------------
// Token Refresh Helper Function
// -----------------------------
async function refreshAccessToken(token: any) {
  try {
    const res = await fetch(
      `${process.env.NEXTCLOUD_URL}/index.php/apps/oauth2/api/v1/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: token.refreshToken,
          client_id: process.env.NEXTCLOUD_CLIENT_ID!,
          client_secret: process.env.NEXTCLOUD_CLIENT_SECRET!,
        }),
      }
    );

    if (!res.ok) {
      // captura respuesta para debugging
      const text = await res.text().catch(() => "");
      throw new Error(`Failed to refresh token: ${res.status} ${text}`);
    }

    const data = await res.json();

    return {
      ...token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? token.refreshToken,
      expiresAt: Date.now() + (data.expires_in ? Number(data.expires_in) * 1000 : 3600 * 1000),
      error: null,
    };
  } catch (err) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

// ------------------------
// Main NextAuth Definition
// ------------------------
export const authOptions: NextAuthOptions = {
  providers: [nextcloudProvider],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user, account }) {
      const t = token as any;

      // Primer login: account existe solo en el primer callback
      if (account) {
        const acc = account as any;

        t.accessToken = acc.access_token;
        t.refreshToken = acc.refresh_token;

        // Calcula expiresAt: preferimos expires_at (timestamp en s),
        // si no existe usamos expires_in (segundos), si no fallback 3600s.
        if (acc.expires_at) {
          // expires_at suele venir en segundos (Unix), convertir a ms
          const ts = Number(acc.expires_at);
          if (!Number.isNaN(ts)) {
            t.expiresAt = ts * 1000;
          } else {
            t.expiresAt = Date.now() + (acc.expires_in ? Number(acc.expires_in) * 1000 : 3600 * 1000);
          }
        } else if (acc.expires_in) {
          t.expiresAt = Date.now() + Number(acc.expires_in) * 1000;
        } else {
          t.expiresAt = Date.now() + 3600 * 1000; // 1 hora por defecto
        }

        // Guardar info de usuario para session
        t.id = user?.id;
        t.name = user?.name;
        t.email = user?.email;

        return t;
      }

      // Si todavía no expiró, devolver token tal cual
      if (t.expiresAt && Date.now() < t.expiresAt) {
        return t;
      }

      // Token expirado o sin expiresAt conocido → refrescar
      return await refreshAccessToken(t);
    },

    async session({ session, token }) {
      // escribir en session.user los campos que uses en cliente
      session.user = {
        ...session.user,
        id: (token as any).id,
        name: (token as any).name ?? session.user?.name,
        email: (token as any).email ?? session.user?.email,
        accessToken: token.accessToken,
    	refreshToken: token.refreshToken,
    	expiresAt: token.expiresAt,
      };

      // propagar posible error para que el cliente lo detecte
      if ((token as any).error) {
        (session as any).error = (token as any).error;
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
