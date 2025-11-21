import { getToken } from "next-auth/jwt";

const tokenCache = new Map<
  string,
  { user: { id: string; name: string; email: string }; expires: number }
>();

export async function requireAuth(request: Request) {
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    throw new Error("No token");
  }

  let accessToken = token.accessToken as string;
  const refreshToken = token.refreshToken as string | undefined; // ← ya viene del JWT
  const now = Date.now();

  if (!accessToken || typeof accessToken !== "string") {
    throw new Error("Invalid access token");
  }

  const cached = tokenCache.get(accessToken);
  if (cached && cached.expires > now) {
    return cached.user;
  }

  const res = await fetch(
    `${process.env.NEXTCLOUD_URL}/ocs/v2.php/cloud/user?format=json`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "OCS-APIRequest": "true",
      },
    }
  );

  // Si token expiró, intentamos refresh
  if (!res.ok && refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken);
    if (!refreshed?.accessToken) throw new Error("Failed to refresh access token");

    accessToken = refreshed.accessToken;

    // Reintento con el token nuevo
    const retryRes = await fetch(
      `${process.env.NEXTCLOUD_URL}/ocs/v2.php/cloud/user?format=json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "OCS-APIRequest": "true",
        },
      }
    );

    if (!retryRes.ok) throw new Error("Invalid refreshed token");

    const user = (await retryRes.json()).ocs?.data;
    const userData = { id: user.id, name: user.displayname, email: user.email };

    tokenCache.set(accessToken, { user: userData, expires: now + 60_000 });
    return userData;
  }

  if (!res.ok) throw new Error("Invalid token and no refresh token available");

  const user = (await res.json()).ocs?.data;
  const userData = { id: user.id, name: user.displayname, email: user.email };
  tokenCache.set(accessToken, { user: userData, expires: now + 60_000 });

  return userData;
}

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string } | null> {
  const res = await fetch(`${process.env.AUTH_SERVER}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return { accessToken: data.accessToken };
}

export const withAuth = (handler: (req: Request, user: any) => Response | Promise<Response>) =>
  async (req: Request) => {
    const user = await requireAuth(req);
    return handler(req, user);
  };
