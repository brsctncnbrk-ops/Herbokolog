import { NextResponse } from "next/server";
import { z } from "zod";
import { checkPassword, createSessionToken, ADMIN_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  let password: string;
  try {
    const json = await req.json();
    password = schema.parse(json).password;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Hatalı şifre." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
