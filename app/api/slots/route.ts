import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { dateInRange, generateSlots, windowsFor } from "@/lib/hours";


export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? "";
  const serviceId = req.nextUrl.searchParams.get("serviceId") ?? "";
  if (!dateInRange(date)) {
    return NextResponse.json({ error: "Date must be today to 30 days ahead" }, { status: 400 });
  }
  const store = getStore();
  const service = (await store.getServices()).find((s) => s.id === serviceId && s.active);
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
  const settings = await store.getSettings();
  const appointments = await store.listAppointments();
  const slots = generateSlots(date, service, settings, appointments);
  return NextResponse.json({ date, serviceId, slots, windows: windowsFor(date, settings.hours) });
}
