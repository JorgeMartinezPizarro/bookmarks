import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  
  try {
    const res = NextResponse.json({ message: 'Cookie delete!' });
    res.cookies.delete('cookieName');
    return res;
  } catch (e) {
    return Response.json({ error: "Error deleting cookie" }, { status: 500 });
  }
}