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

  if (!token || !token.accessToken) {
    throw new Error("No access token");
  }

  if (typeof token?.accessToken !== "string") {
    throw new Error("Invalid access token");
  }

  const accessToken = token.accessToken as string;
  
  const now = Date.now();

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

  if (!res.ok) {
    throw new Error("Invalid token");
  }

  const json = await res.json();
  const user = json.ocs?.data;

  const userData = {
    id: user.id,
    name: user.displayname,
    email: user.email,
  };

  tokenCache.set(accessToken, {
    user: userData,
    expires: now + 60_000, // 1 minuto
  });

  return userData;
}