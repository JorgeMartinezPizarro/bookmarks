// app/lib/auth.ts
import { getToken } from "next-auth/jwt";

export async function requireAuth(request: Request) {
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || !token.accessToken) {
    throw new Error("No access token");
  }

  // Validamos el token contra Nextcloud
  const res = await fetch(process.env.NEXTCLOUD_URL + "/ocs/v2.php/cloud/user?format=json", {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Invalid token");
  }

  const json = await res.json();
  const user = json.ocs?.data;

  return {
    id: user.id,
    name: user.displayname,
    email: user.email,
  };
}
