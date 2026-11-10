import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { isAdmin } from "@/lib/auth";
import type { Service } from "@/lib/types";


export async function GET(req: NextRequest) {
  const store = getStore();
  const services = await store.getServices();
  const all = req.nextUrl.searchParams.get("all") === "1";
  if (all) {
    if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(services);
  }
  return NextResponse.json(services.filter((s) => s.active));
}

function validService(s: unknown): s is Service {
  if (!s || typeof s !== "object") return false;
  const o = s as Record<string, unknown>;
  return (
    typeof o.id === "string" && o.id.trim().length > 0 &&
    typeof o.nameBn === "string" && o.nameBn.trim().length > 0 &&
    typeof o.nameEn === "string" && o.nameEn.trim().length > 0 &&
    typeof o.descBn === "string" && typeof o.descEn === "string" &&
    typeof o.price === "number" && Number.isFinite(o.price) && o.price >= 0 &&
    typeof o.durationMin === "number" && Number.isInteger(o.durationMin) && o.durationMin >= 15 && o.durationMin <= 240 &&
    typeof o.active === "boolean"
  );
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body) || body.some((s) => !validService(s))) {
    return NextResponse.json({ error: "Invalid services list" }, { status: 400 });
  }
  const ids = new Set<string>();
  for (const s of body as Service[]) {
    if (ids.has(s.id)) return NextResponse.json({ error: "Duplicate service id" }, { status: 400 });
    ids.add(s.id);
  }
  const cleaned: Service[] = (body as Service[]).map((s) => ({
    id: s.id.trim(),
    nameBn: s.nameBn.trim(),
    nameEn: s.nameEn.trim(),
    descBn: s.descBn.trim(),
    descEn: s.descEn.trim(),
    price: Math.round(s.price),
    durationMin: s.durationMin,
    active: s.active,
  }));
  await getStore().saveServices(cleaned);
  return NextResponse.json(cleaned);
}
