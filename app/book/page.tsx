"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { bnDigits, fmtMoney, useLang } from "@/lib/i18n";
import { useServices, useSettings } from "@/lib/useSite";
import { addDaysStr, dhakaTodayStr, isValidBdPhone, toHHMM } from "@/lib/hours";
import Molar from "@/components/Molar";
import type { Appointment, Service } from "@/lib/types";

const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_BN = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];

function fmtDate(dateStr: string, lang: "bn" | "en"): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const wd = lang === "bn" ? WEEKDAYS_BN[d.getUTCDay()] : WEEKDAYS_EN[d.getUTCDay()];
  const day = bnDigits(d.getUTCDate(), lang);
  const mo = d.toLocaleString(lang === "bn" ? "bn-BD" : "en-GB", { month: "long", timeZone: "UTC" });
  const y = bnDigits(d.getUTCFullYear(), lang);
  return `${wd}, ${day} ${mo} ${y}`;
}

function slotEnd(slot: string, durMin: number): string {
  const [h, m] = slot.split(":").map(Number);
  return toHHMM(h * 60 + m + durMin);
}

function BookInner() {
  const { lang, t } = useLang();
  const searchParams = useSearchParams();
  const { services } = useServices();
  const { settings } = useSettings();

  // "Today" is read on the client after mount so the prerender stays stable.
  const [today, setToday] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    const t = dhakaTodayStr();
    setToday(t);
    setDate((d) => d || t);
  }, []);
  const maxDate = today ? addDaysStr(today, 30) : "";

  const [serviceId, setServiceId] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Appointment | null>(null);

  const activeServices = useMemo(() => (services ?? []).filter((s) => s.active), [services]);
  const service: Service | undefined = activeServices.find((s) => s.id === serviceId);

  // Preselect service from ?service= (e.g. from a service card on home).
  useEffect(() => {
    const pre = searchParams.get("service");
    if (pre && activeServices.some((s) => s.id === pre)) setServiceId(pre);
  }, [searchParams, activeServices]);

  const loadSlots = useCallback(async (sid: string, d: string) => {
    setSlotsLoading(true);
    setSlot(null);
    try {
      const res = await fetch(`/api/slots?date=${d}&serviceId=${encodeURIComponent(sid)}`);
      const data = await res.json();
      setSlots(res.ok ? (data.slots as string[]) : []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (serviceId && date) loadSlots(serviceId, date);
  }, [serviceId, date, loadSlots]);

  const step = !service ? 1 : !slot ? 2 : 3;

  async function submit() {
    setError(null);
    if (!service) return;
    if (!name.trim()) {
      setError(t("book.errName"));
      return;
    }
    if (!isValidBdPhone(phone)) {
      setError(t("book.errPhone"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, date, slot, name: name.trim(), phone: phone.trim(), notes: notes.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(res.status === 409 ? t("book.errSlot") : (data.error as string) || t("book.errGeneric"));
        if (res.status === 409) loadSlots(service.id, date);
        return;
      }
      setDone(data as Appointment);
    } catch {
      setError(t("book.errGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  const phoneDisplay = settings?.phone ?? "01718-768931";
  const telHref = `tel:+880${phoneDisplay.replace(/[^0-9]/g, "").replace(/^0/, "")}`;

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 md:py-20">
        <div className="rounded-[2rem] border border-line bg-white p-8 text-center shadow-xl shadow-teal/10 sm:p-10">
          <div className="mx-auto w-20">
            <Molar className="h-auto w-full" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">{t("book.success")}</h1>
          <p className="mx-auto mt-3 max-w-md text-[16px] leading-relaxed text-ink/65">{t("book.successSub")}</p>
          <p className="mt-7 text-xs font-semibold uppercase tracking-widest text-muted">{t("book.ref")}</p>
          <p className="mt-2 text-4xl font-bold tracking-[0.15em] text-teal">{done.ref}</p>

          <dl className="mx-auto mt-8 max-w-sm space-y-2.5 rounded-2xl bg-mist p-5 text-left text-[15px]">
            <div className="flex justify-between gap-4"><dt className="text-muted">{t("book.service")}</dt><dd className="font-semibold">{lang === "bn" ? done.serviceNameBn : done.serviceNameEn}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">{t("book.date")}</dt><dd className="font-semibold">{fmtDate(done.date, lang)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">{t("book.time")}</dt><dd className="font-semibold">{bnDigits(done.slot, lang)} – {bnDigits(slotEnd(done.slot, done.durationMin), lang)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">{t("book.duration")}</dt><dd className="font-semibold">{bnDigits(done.durationMin, lang)} {t("common.min")}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">{t("book.price")}</dt><dd className="font-semibold">{fmtMoney(done.price, lang)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">{t("book.name")}</dt><dd className="font-semibold">{done.name}</dd></div>
          </dl>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={telHref} className="btn-step rounded-full bg-teal px-5 py-3 text-sm font-semibold text-white hover:bg-teal-deep">{t("book.callClinic")}</a>
            <button type="button" onClick={() => { setDone(null); setServiceId(null); setSlot(null); setName(""); setPhone(""); setNotes(""); setDate(today); }} className="btn-step rounded-full border-2 border-ink bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:border-teal hover:text-teal">
              {t("book.bookAnother")}
            </button>
            <Link href="/" className="btn-step rounded-full px-5 py-3 text-sm font-semibold text-ink/70 hover:text-ink">← {t("nav.home")}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("book.title")}</h1>
      <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-ink/65">{t("book.sub")}</p>

      {/* Stepper */}
      <ol className="mt-8 flex gap-2 text-[13px] font-semibold">
        {[
          { n: 1, label: t("book.stepService"), active: step === 1, done: step > 1 },
          { n: 2, label: t("book.stepDate"), active: step === 2, done: step > 2 },
          { n: 3, label: t("book.stepDetails"), active: step === 3, done: false },
        ].map((s) => (
          <li key={s.n} className={`flex-1 rounded-full px-3 py-2 text-center ${s.active ? "bg-teal text-white" : s.done ? "bg-leaf/15 text-leaf" : "bg-white text-muted border border-line"}`}>
            {s.label}
          </li>
        ))}
      </ol>

      {/* Step 1 — service */}
      <section className="mt-8 rounded-3xl border border-line bg-white p-6 sm:p-7">
        <h2 className="text-lg font-bold">{t("book.stepService")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {activeServices.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServiceId(s.id)}
              className={`card-lift rounded-2xl border-2 p-4 text-left ${serviceId === s.id ? "border-teal bg-mist" : "border-line bg-white hover:border-teal/50"}`}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="font-bold">{lang === "bn" ? s.nameBn : s.nameEn}</span>
                <span className="shrink-0 font-bold text-teal">{fmtMoney(s.price, lang)}</span>
              </span>
              <span className="mt-1 block text-sm text-ink/60">{lang === "bn" ? s.descBn : s.descEn}</span>
              <span className="mt-2 block text-xs font-semibold text-muted">{bnDigits(s.durationMin, lang)} {t("common.min")}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Step 2 — date & time */}
      {service && date && (
        <section className="mt-5 rounded-3xl border border-line bg-white p-6 sm:p-7">
          <h2 className="text-lg font-bold">{t("book.stepDate")}</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={date}
              min={today}
              max={maxDate}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="rounded-xl border-2 border-line bg-white px-4 py-2.5 text-[15px] font-semibold outline-none focus:border-teal"
            />
            <div className="flex gap-2">
              {[0, 1, 2].map((off) => {
                const d = addDaysStr(today, off);
                const label = off === 0 ? (lang === "bn" ? "আজ" : "Today") : off === 1 ? (lang === "bn" ? "আগামীকাল" : "Tomorrow") : fmtDate(d, lang);
                return (
                  <button key={d} type="button" onClick={() => setDate(d)} className={`rounded-full px-3.5 py-2 text-[13px] font-semibold ${date === d ? "bg-teal text-white" : "border border-line bg-white text-ink/70 hover:border-teal"}`}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="mt-3 text-sm font-medium text-muted">{fmtDate(date, lang)}</p>

          {slotsLoading ? (
            <p className="mt-5 text-sm text-muted">{t("book.loading")}</p>
          ) : slots && slots.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-mist px-4 py-3 text-sm font-medium text-ink/70">{t("book.noSlots")}</p>
          ) : (
            <div className="mt-5">
              <p className="text-sm font-semibold text-ink/70">{t("book.pickTime")}</p>
              <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {(slots ?? []).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={`rounded-xl border-2 px-2 py-2.5 text-sm font-bold ${slot === s ? "border-teal bg-teal text-white" : "border-line bg-white text-ink hover:border-teal"}`}
                  >
                    {bnDigits(s, lang)}
                    <span className="block text-[11px] font-medium opacity-70">– {bnDigits(slotEnd(s, service.durationMin), lang)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Step 3 — details */}
      {service && slot && (
        <section className="mt-5 rounded-3xl border border-line bg-white p-6 sm:p-7">
          <h2 className="text-lg font-bold">{t("book.stepDetails")}</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="bk-name" className="text-sm font-semibold">{t("book.name")}</label>
              <input id="bk-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("book.namePh")} className="mt-1.5 w-full rounded-xl border-2 border-line px-4 py-3 text-[15px] outline-none focus:border-teal" />
            </div>
            <div>
              <label htmlFor="bk-phone" className="text-sm font-semibold">{t("book.phone")}</label>
              <input id="bk-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("book.phonePh")} inputMode="tel" className="mt-1.5 w-full rounded-xl border-2 border-line px-4 py-3 text-[15px] outline-none focus:border-teal" />
            </div>
            <div>
              <label htmlFor="bk-notes" className="text-sm font-semibold">{t("book.notes")}</label>
              <textarea id="bk-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("book.notesPh")} rows={3} className="mt-1.5 w-full rounded-xl border-2 border-line px-4 py-3 text-[15px] outline-none focus:border-teal" />
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-mist p-4 text-[15px]">
            <p className="font-bold">{lang === "bn" ? service.nameBn : service.nameEn} · {fmtMoney(service.price, lang)}</p>
            <p className="mt-1 text-ink/65">{fmtDate(date, lang)} · {bnDigits(slot, lang)} – {bnDigits(slotEnd(slot, service.durationMin), lang)} ({bnDigits(service.durationMin, lang)} {t("common.min")})</p>
          </div>

          {error && <p role="alert" className="mt-4 rounded-xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral">{error}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={submit} disabled={submitting} className="btn-step rounded-full bg-teal px-6 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-teal/25 hover:bg-teal-deep disabled:opacity-60">
              {submitting ? t("book.confirming") : t("book.confirm")}
            </button>
            <button type="button" onClick={() => setSlot(null)} className="btn-step rounded-full border-2 border-ink bg-white px-5 py-3 text-[15px] font-semibold text-ink hover:border-teal hover:text-teal">
              {t("book.back")}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-16 text-muted">Loading…</div>}>
      <BookInner />
    </Suspense>
  );
}
