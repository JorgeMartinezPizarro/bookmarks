import { NextResponse } from 'next/server';
import crypto from 'crypto-js'

const PASSWORD = process.env.BOOKMARKS_PASSWORD || ""; // Set this in your .env.local or .env.production

export async function POST(req: Request) {
  const body = await req.json();

  const password: string = crypto.MD5(body.password || "").toString();

  if (password === crypto.MD5(PASSWORD).toString()) {
    const res = NextResponse.json({ message: 'Cookie set!' });
    const cookieValue = crypto.MD5(PASSWORD).toString()
    res.cookies.set('cookieName', cookieValue, { httpOnly: true });
    return res;
  } else {
    return Response.json({ error: "Invalid password" }, { status: 401 });
  }
}