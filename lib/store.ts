import { promises as fs } from "node:fs";
import path from "node:path";
import { MongoClient, type Db } from "mongodb";
import type { Appointment, DbShape, Service, Settings } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");
const DB_NAME = "abrar-dental";

/* ---------------- Seed data ---------------- */

export function defaultServices(): Service[] {
  return [
    { id: "checkup", nameBn: "ডেন্টাল চেকআপ", nameEn: "Dental Checkup", descBn: "দাঁত ও মাড়ির সম্পূর্ণ পরীক্ষা এবং পরামর্শ।", descEn: "Complete teeth and gum examination with advice.", price: 500, durationMin: 30, active: true },
    { id: "scaling", nameBn: "স্কেলিং", nameEn: "Scaling", descBn: "দাঁতের পাথর ও দাগ পরিষ্কার করে ঝকঝকে হাসি।", descEn: "Removes tartar and stains for a cleaner smile.", price: 2000, durationMin: 45, active: true },
    { id: "filling", nameBn: "ফিলিং", nameEn: "Filling", descBn: "ক্যাভিটি ভরাট করে দাঁতের ব্যথা ও ক্ষয় থামান।", descEn: "Fills cavities to stop pain and further decay.", price: 1500, durationMin: 45, active: true },
    { id: "cosmetic-filling", nameBn: "কসমেটিক ফিলিং", nameEn: "Cosmetic Filling", descBn: "দাঁতের রঙের সাথে মিলিয়ে নিখুঁত ফিলিং — বোঝাই যাবে না।", descEn: "Tooth-coloured filling that blends in invisibly.", price: 2500, durationMin: 45, active: true },
    { id: "root-canal", nameBn: "রুট ক্যানেল ট্রিটমেন্ট", nameEn: "Root Canal Treatment", descBn: "সংক্রমিত দাঁত বাঁচিয়ে ব্যথা থেকে স্থায়ী মুক্তি।", descEn: "Saves an infected tooth and ends the pain for good.", price: 6000, durationMin: 60, active: true },
    { id: "crown", nameBn: "ক্রাউন (ক্যাপ)", nameEn: "Crown", descBn: "দুর্বল বা ভাঙা দাঁতের উপর মজবুত সুরক্ষা।", descEn: "A strong protective cap for weak or broken teeth.", price: 8000, durationMin: 60, active: true },
    { id: "zirconia-crown", nameBn: "জিরকোনিয়া ক্রাউন", nameEn: "Zirconia Crown", descBn: "সবচেয়ে আধুনিক, প্রাকৃতিক ও টেকসই ক্রাউন।", descEn: "The most modern, natural-looking and durable crown.", price: 15000, durationMin: 60, active: true },
    { id: "extraction", nameBn: "দাঁত তোলা", nameEn: "Tooth Extraction", descBn: "নিরাপদ ও যত্নে দাঁত তোলা — শিশুদের দাঁতসহ।", descEn: "Safe, gentle extraction — including children's teeth.", price: 1200, durationMin: 30, active: true },
    { id: "whitening", nameBn: "দাঁত সাদা করা", nameEn: "Teeth Whitening", descBn: "এক সেশনেই দাগমুক্ত উজ্জ্বল হাসি।", descEn: "A brighter, stain-free smile in a single session.", price: 5000, durationMin: 60, active: true },
    { id: "children", nameBn: "শিশুদের দাঁতের যত্ন", nameEn: "Children's Dental Care", descBn: "শিশুদের জন্য ভয়মুক্ত, বন্ধুত্বপূর্ণ দাঁতের চিকিৎসা।", descEn: "Fear-free, friendly dental care for children.", price: 800, durationMin: 30, active: true },
  ];
}

export function defaultSettings(): Settings {
  // Hours from the clinic's Facebook Page. 0 = Sunday … 6 = Saturday.
  // Mon–Thu, Sat, Sun: 10:00–13:00 & 15:30–23:00 (Thu morning to 13:30).
  // Friday: 16:00–22:00 only.
  const day: Settings["hours"]["1"] = [
    { open: "10:00", close: "13:00" },
    { open: "15:30", close: "23:00" },
  ];
  return {
    clinicName: "Abrar Active Dental",
    phone: "01718-768931",
    whatsapp: "8801718768931",
    email: "dr.arifa1bds@gmail.com",
    addressBn: "বাড়ি #৭৫, ব্লক #ই, রোড #২, কালশী মোড়, মিরপুর-১২, ঢাকা ১২১৬",
    addressEn: "House #75, Block #E, Road #2, Kalshi Mor, Mirpur-12, Dhaka 1216",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Abrar+Active+Dental+Kalshi+Mor+Mirpur-12+Dhaka",
    hours: {
      "0": day,
      "1": day,
      "2": day,
      "3": day,
      "4": [
        { open: "10:00", close: "13:30" },
        { open: "15:30", close: "23:00" },
      ],
      "5": [{ open: "16:00", close: "22:00" }],
      "6": day,
    },
  };
}

function seedDb(): DbShape {
  return { services: defaultServices(), settings: defaultSettings(), appointments: [] };
}

/* ---------------- Store interface ---------------- */

export interface Store {
  getServices(): Promise<Service[]>;
  saveServices(services: Service[]): Promise<void>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
  listAppointments(): Promise<Appointment[]>;
  createAppointment(a: Appointment): Promise<Appointment>;
  updateAppointment(id: string, patch: Partial<Appointment>): Promise<Appointment | null>;
  deleteAppointment(id: string): Promise<boolean>;
}

/* ---------------- JSON file store ---------------- */

class FileStore implements Store {
  private cache: DbShape | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  private async read(): Promise<DbShape> {
    if (this.cache) return this.cache;
    try {
      const raw = await fs.readFile(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw) as DbShape;
      if (!Array.isArray(parsed.services) || !parsed.settings) throw new Error("bad db");
      this.cache = parsed;
    } catch {
      this.cache = seedDb();
      await this.persist();
    }
    return this.cache;
  }

  private persist(): Promise<void> {
    const data = JSON.stringify(this.cache, null, 2);
    this.writeQueue = this.writeQueue.then(async () => {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const tmp = `${DATA_FILE}.tmp-${process.pid}`;
      await fs.writeFile(tmp, data, "utf8");
      await fs.rename(tmp, DATA_FILE);
    });
    return this.writeQueue;
  }

  async getServices() {
    return (await this.read()).services;
  }
  async saveServices(services: Service[]) {
    const db = await this.read();
    db.services = services;
    await this.persist();
  }
  async getSettings() {
    return (await this.read()).settings;
  }
  async saveSettings(settings: Settings) {
    const db = await this.read();
    db.settings = settings;
    await this.persist();
  }
  async listAppointments() {
    return (await this.read()).appointments;
  }
  async createAppointment(a: Appointment) {
    const db = await this.read();
    db.appointments.push(a);
    await this.persist();
    return a;
  }
  async updateAppointment(id: string, patch: Partial<Appointment>) {
    const db = await this.read();
    const item = db.appointments.find((x) => x.id === id);
    if (!item) return null;
    Object.assign(item, patch);
    await this.persist();
    return item;
  }
  async deleteAppointment(id: string) {
    const db = await this.read();
    const before = db.appointments.length;
    db.appointments = db.appointments.filter((x) => x.id !== id);
    if (db.appointments.length === before) return false;
    await this.persist();
    return true;
  }
}

/* ---------------- MongoDB store ---------------- */

let mongoClient: MongoClient | null = null;

async function getMongoDb(): Promise<Db> {
  if (!mongoClient) {
    mongoClient = new MongoClient(process.env.MONGODB_URI as string);
    await mongoClient.connect();
  }
  return mongoClient.db(DB_NAME);
}

async function ensureSeeded(db: Db): Promise<void> {
  const count = await db.collection<Service>("services").countDocuments();
  if (count === 0) {
    await db.collection<Service>("services").insertMany(defaultServices());
  }
  const settings = await db.collection<Settings & { _id: string }>("settings").findOne({ _id: "main" });
  if (!settings) {
    await db.collection<Settings & { _id: string }>("settings").insertOne({ _id: "main", ...defaultSettings() });
  }
}

class MongoStore implements Store {
  private async db() {
    const db = await getMongoDb();
    await ensureSeeded(db);
    return db;
  }
  async getServices() {
    const db = await this.db();
    const docs = await db.collection<Service>("services").find({}).toArray();
    return docs.map((d) => stripId(d));
  }
  async saveServices(services: Service[]) {
    const db = await this.db();
    const col = db.collection<Service>("services");
    await col.deleteMany({});
    if (services.length > 0) await col.insertMany(services);
  }
  async getSettings() {
    const db = await this.db();
    const doc = await db.collection<Settings & { _id: string }>("settings").findOne({ _id: "main" });
    if (!doc) return defaultSettings();
    return stripId(doc) as Settings;
  }
  async saveSettings(settings: Settings) {
    const db = await this.db();
    await db
      .collection<Settings & { _id: string }>("settings")
      .updateOne({ _id: "main" }, { $set: settings }, { upsert: true });
  }
  async listAppointments() {
    const db = await this.db();
    const docs = await db.collection<Appointment>("appointments").find({}).toArray();
    return docs.map((d) => stripId(d));
  }
  async createAppointment(a: Appointment) {
    const db = await this.db();
    await db.collection<Appointment>("appointments").insertOne({ ...a });
    return a;
  }
  async updateAppointment(id: string, patch: Partial<Appointment>) {
    const db = await this.db();
    const res = await db
      .collection<Appointment>("appointments")
      .findOneAndUpdate({ id }, { $set: patch }, { returnDocument: "after" });
    return res ? stripId(res) : null;
  }
  async deleteAppointment(id: string) {
    const db = await this.db();
    const res = await db.collection<Appointment>("appointments").deleteOne({ id });
    return res.deletedCount > 0;
  }
}

function stripId<T>(doc: T & { _id?: unknown }): T {
  const { _id, ...rest } = doc;
  void _id;
  return rest as T;
}

/* ---------------- Adapter selection ---------------- */

let store: Store | null = null;

export function getStore(): Store {
  if (store) return store;
  const uri = (process.env.MONGODB_URI || "").trim();
  store = uri ? new MongoStore() : new FileStore();
  return store;
}

export function isMongo(): boolean {
  return Boolean((process.env.MONGODB_URI || "").trim());
}
