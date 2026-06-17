import { getToken } from "next-auth/jwt";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

const tokenCache = new Map<
  string,
  { user: AuthUser; expires: number }
>();

type NextcloudUserPayload = {
  ocs?: {
    data?: {
      id?: string | number;
      displayname?: string;
      email?: string;
    };
  };
};

function parseNextcloudUser(payload: unknown): AuthUser {
  const data = (payload as NextcloudUserPayload)?.ocs?.data;
  const id = data?.id != null ? String(data.id).trim() : "";

  if (!id) {
    throw new Error("Invalid user profile");
  }

  const name = data?.displayname?.trim() || "";
  const email = data?.email?.trim() || "";

  return {
    id,
    name: name || email || id,
    email: email || id,
  };
}

async function fetchNextcloudUser(accessToken: string): Promise<Response> {
  return fetch(`${process.env.NEXTCLOUD_URL}/ocs/v2.php/cloud/user?format=json`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "OCS-APIRequest": "true",
    },
  });
}

export async function requireAuth(request: Request): Promise<AuthUser> {
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    throw new Error("No token");
  }

  let accessToken = token.accessToken as string;
  const refreshToken = token.refreshToken as string | undefined;
  const now = Date.now();

  if (!accessToken || typeof accessToken !== "string") {
    throw new Error("Invalid access token");
  }

  const cached = tokenCache.get(accessToken);
  if (cached && cached.expires > now) {
    return cached.user;
  }

  const res = await fetchNextcloudUser(accessToken);

  if (!res.ok && refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken);
    if (!refreshed?.accessToken) {
      throw new Error("Failed to refresh access token");
    }

    accessToken = refreshed.accessToken;

    const retryRes = await fetchNextcloudUser(accessToken);
    if (!retryRes.ok) {
      throw new Error("Invalid refreshed token");
    }

    const user = parseNextcloudUser(await retryRes.json());
    tokenCache.set(accessToken, { user, expires: now + 60_000 });
    return user;
  }

  if (!res.ok) {
    throw new Error("Invalid token and no refresh token available");
  }

  const user = parseNextcloudUser(await res.json());
  tokenCache.set(accessToken, { user, expires: now + 60_000 });
  return user;
}

async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string } | null> {
  const res = await fetch(`${process.env.AUTH_SERVER}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return { accessToken: data.accessToken };
}

export const withAuth = (
  handler: (req: Request, user: AuthUser) => Response | Promise<Response>
) =>
  async (req: Request) => {
    const user = await requireAuth(req);
    return handler(req, user);
  };
