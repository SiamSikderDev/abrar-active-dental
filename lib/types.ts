export type ApptStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Service {
  id: string;
  nameBn: string;
  nameEn: string;
  descBn: string;
  descEn: string;
  /** Demo starting price in BDT — editable from the admin panel. */
  price: number;
  durationMin: number;
  active: boolean;
}

export interface HoursWindow {
  open: string; // "HH:MM" 24h
  close: string; // "HH:MM" 24h
}

/** Keys are JS weekday numbers as strings: 0 = Sunday … 6 = Saturday. */
export type WeekHours = Record<string, HoursWindow[]>;

export interface Settings {
  clinicName: string;
  phone: string;
  whatsapp: string;
  email: string;
  addressBn: string;
  addressEn: string;
  mapUrl: string;
  hours: WeekHours;
}

export interface Appointment {
  id: string;
  ref: string; // AAD-XXXX
  serviceId: string;
  serviceNameEn: string;
  serviceNameBn: string;
  price: number;
  durationMin: number;
  date: string; // YYYY-MM-DD
  slot: string; // "HH:MM" start
  name: string;
  phone: string;
  notes: string;
  status: ApptStatus;
  createdAt: string; // ISO
}

export interface DbShape {
  services: Service[];
  settings: Settings;
  appointments: Appointment[];
}
