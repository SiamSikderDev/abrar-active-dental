import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { isAdmin } from "@/lib/auth";
import type { ApptStatus } from "@/lib/types";


const STATUSES: ApptStatus[] = ["pending", "confirmed", "cancelled", "completed"];

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const status = body.status as string;
  if (!STATUSES.includes(status as ApptStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const updated = await getStore().updateAppointment(id, { status: status as ApptStatus });
  if (!updated) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ok = await getStore().deleteAppointment(id);
  if (!ok) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
