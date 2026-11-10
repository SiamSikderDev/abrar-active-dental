# Abrar Active Dental — Website + Appointment Booking

Bilingual (Bangla + English) website for **Abrar Active Dental**, Mirpur-12, Dhaka,
with online appointment booking and a clinic admin panel.

- Public site: hero, services with starting prices, how booking works, doctor,
  patient reviews, opening hours, address & contact.
- Booking: pick a treatment → date (today to +30 days) → free 30-minute slots
  generated from the clinic's real opening hours → patient details → reference
  code (AAD-XXXX). The clinic confirms by phone/WhatsApp.
- Admin (`/admin`): sign in, see stats, filter appointments by date/status,
  Confirm / Cancel / Complete / Delete, edit services & prices, edit opening
  hours / phone / address. All changes are live immediately.

## Live site

- Website: https://abrar-active-dental-siamsikderdevs-projects.vercel.app
- Admin panel: https://abrar-active-dental-siamsikderdevs-projects.vercel.app/admin
- GitHub: https://github.com/SiamSikderDev/abrar-active-dental

## Stack

Next.js 16 (App Router, TypeScript) + Tailwind CSS v4 + GSAP (ScrollTrigger)
for all animation. No photos — the site uses custom SVG illustrations only
(a friendly smiling molar, matching the clinic's logo).

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## Environment (`.env.local`)

```bash
ADMIN_PASSWORD=<temporary password — shared with the site owner separately>
ADMIN_SECRET=<random 32-hex string>
# Leave empty to use the built-in JSON file store (data/db.json).
# Set a MongoDB Atlas connection string for live persistence.
MONGODB_URI=
```

## Storage — read this before deploying

`lib/store.ts` picks the backend from `MONGODB_URI`:

- **Empty** → JSON file store at `data/db.json` (gitignored). Works fully for
  local dev and testing.
- **Set** → MongoDB driver, database `abrar-dental`, collections
  `appointments`, `services`, `settings`. Services + default settings are
  seeded on first use in both backends.

**On Vercel the file store is ephemeral** — every deployment / serverless
invocation can lose bookings. For production, set `MONGODB_URI` in the
Vercel project environment variables. Never commit a connection string.

## Admin access

The admin password is set in `.env.local` (`ADMIN_PASSWORD`). The temporary
password was shared with the site owner separately — it is not written in
this README or any committed file. To change it, edit `.env.local` and
restart the server. The login sets an httpOnly `admin_session` cookie
(HMAC-SHA256, 7 days).

## Prices

Treatment prices on the site are **demo starting prices** (BDT) — the clinic
has no published price list. The admin can change every price, duration and
name from `/admin` → Services & prices.
