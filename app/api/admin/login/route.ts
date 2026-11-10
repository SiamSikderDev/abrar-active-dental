import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, COOKIE_OPTS, checkPassword, expectedSessionValue } from "@/lib/auth";


export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const password = typeof body.password === "string" ? body.password : "";
  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const value = expectedSessionValue();
  if (!value) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, value, COOKIE_OPTS);
  return res;
}
