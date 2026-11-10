import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getStore } from "@/lib/store";
import { isAdmin } from "@/lib/auth";
import { dateInRange, generateSlots, isValidBdPhone, normalizeBdPhone } from "@/lib/hours";
import type { Appointment, ApptStatus } from "@/lib/types";


const STATUSES: ApptStatus[] = ["pending", "confirmed", "cancelled", "completed"];

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const date = req.nextUrl.searchParams.get("date") ?? "";
  const status = req.nextUrl.searchParams.get("status") ?? "";
  let list = await getStore().listAppointments();
  if (date) list = list.filter((a) => a.date === date);
  if (status) {
    if (!STATUSES.includes(status as ApptStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    list = list.filter((a) => a.status === status);
  }
  list.sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot));
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const serviceId = typeof body.serviceId === "string" ? body.serviceId : "";
  const date = typeof body.date === "string" ? body.date : "";
  const slot = typeof body.slot === "string" ? body.slot : "";
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : "";

  if (!name || name.length > 100) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!isValidBdPhone(phone)) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  if (!dateInRange(date)) return NextResponse.json({ error: "Date must be today to 30 days ahead" }, { status: 400 });
  if (!/^\d{2}:\d{2}$/.test(slot)) return NextResponse.json({ error: "Invalid time slot" }, { status: 400 });

  const store = getStore();
  const service = (await store.getServices()).find((s) => s.id === serviceId && s.active);
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const settings = await store.getSettings();
  const existing = await store.listAppointments();
  // Recompute availability server-side: enforces opening hours, past slots
  // and the one-chair no-overlap rule. Never trust the client's slot list.
  const available = generateSlots(date, service, settings, existing);
  if (!available.includes(slot)) {
    return NextResponse.json({ error: "Slot is not available" }, { status: 409 });
  }

  let ref = "";
  for (let i = 0; i < 10; i++) {
    const candidate = `AAD-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!existing.some((a) => a.ref === candidate)) {
      ref = candidate;
      break;
    }
  }
  if (!ref) return NextResponse.json({ error: "Could not allocate a reference code" }, { status: 500 });

  const appt: Appointment = {
    id: randomUUID(),
    ref,
    serviceId: service.id,
    serviceNameEn: service.nameEn,
    serviceNameBn: service.nameBn,
    price: service.price,
    durationMin: service.durationMin,
    date,
    slot,
    name,
    phone: normalizeBdPhone(phone),
    notes,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await store.createAppointment(appt);
  return NextResponse.json(appt, { status: 201 });
}
