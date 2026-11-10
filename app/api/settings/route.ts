import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { isAdmin } from "@/lib/auth";
import { parseHHMM } from "@/lib/hours";
import type { HoursWindow, Settings, WeekHours } from "@/lib/types";


export async function GET() {
  const settings = await getStore().getSettings();
  return NextResponse.json(settings);
}

function validHours(h: unknown): h is WeekHours {
  if (!h || typeof h !== "object" || Array.isArray(h)) return false;
  for (const [k, v] of Object.entries(h as Record<string, unknown>)) {
    if (!/^[0-6]$/.test(k) || !Array.isArray(v)) return false;
    for (const w of v as unknown[]) {
      if (!w || typeof w !== "object") return false;
      const { open, close } = w as Record<string, unknown>;
      if (typeof open !== "string" || typeof close !== "string") return false;
      const o = parseHHMM(open);
      const c = parseHHMM(close);
      if (!Number.isFinite(o) || !Number.isFinite(c) || c <= o) return false;
    }
  }
  return true;
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { phone, email, addressBn, addressEn, mapUrl, whatsapp, hours } = body;
  if (
    typeof phone !== "string" || !phone.trim() ||
    typeof email !== "string" || !email.trim() ||
    typeof addressBn !== "string" || !addressBn.trim() ||
    typeof addressEn !== "string" || !addressEn.trim() ||
    (mapUrl !== undefined && typeof mapUrl !== "string") ||
    (whatsapp !== undefined && typeof whatsapp !== "string") ||
    !validHours(hours)
  ) {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }
  const settings: Settings = {
    clinicName: "Abrar Active Dental",
    phone: phone.trim(),
    email: email.trim(),
    addressBn: addressBn.trim(),
    addressEn: addressEn.trim(),
    mapUrl: typeof mapUrl === "string" && mapUrl.trim() ? mapUrl.trim() : "",
    whatsapp: typeof whatsapp === "string" ? whatsapp.trim() : "",
    hours: hours as WeekHours,
  };
  // Normalize: every weekday present, windows sorted.
  for (let d = 0; d <= 6; d++) {
    const wins: HoursWindow[] = (settings.hours[String(d)] ?? []).slice().sort((a, b) => a.open.localeCompare(b.open));
    settings.hours[String(d)] = wins;
  }
  await getStore().saveSettings(settings);
  return NextResponse.json(settings);
}
