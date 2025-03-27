// lib/requireAuth.ts
import { NextRequest, NextResponse } from 'next/server';
import { errorMessage } from '../helpers';
import { getServerSession } from "next-auth";
import { Session } from 'next-auth';
import { authOptions } from "../api/oauth/callback/route";

type UserInfo = {
  id: string;
  displayName: string;
  email?: string;
  [key: string]: any;
};

export async function requireAuth(request: NextRequest): Promise<Session> {
  const session = await getServerSession(authOptions);

  try {
    if (!session)
      throw new Error("Invalid session!")
    return session;
  } catch (err) {
    throw new Error("Error parsing user\n"+errorMessage(err));
  }
}
