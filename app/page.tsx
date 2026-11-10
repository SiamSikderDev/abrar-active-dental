"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { bnDigits, fmtMoney, useLang } from "@/lib/i18n";
import { useServices, useSettings } from "@/lib/useSite";
import { dhakaNowMinutes, dhakaTodayStr, parseHHMM, weekdayOf } from "@/lib/hours";
import Molar, { ToothMark } from "@/components/Molar";
import Reveal, { useHeroEntrance } from "@/components/Reveal";
import type { Settings } from "@/lib/types";

const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_BN = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];

function hoursSummary(settings: Settings, lang: "bn" | "en"): { todayText: string; openNow: boolean } {
  const today = dhakaTodayStr();
  const wd = weekdayOf(today);
  const windows = settings.hours[String(wd)] ?? [];
  const now = dhakaNowMinutes();
  const openNow = windows.some((w) => now >= parseHHMM(w.open) && now < parseHHMM(w.close));
  const fmt = (s: string) => bnDigits(s, lang);
  const todayText =
    windows.length === 0
      ? ""
      : windows.map((w) => `${fmt(w.open)}–${fmt(w.close)}`).join("  ·  ");
  return { todayText, openNow };
}

export default function Home() {
  const { lang, t } = useLang();
  const { services } = useServices();
  const { settings } = useSettings();
  const heroRef = useRef<HTMLElement>(null);
  useHeroEntrance(heroRef);

  // "Today" is read on the client after mount so the prerender stays stable.
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(dhakaTodayStr());
  }, []);

  const hours = useMemo(
    () => (settings && today ? hoursSummary(settings, lang) : null),
    [settings, lang, today]
  );
  const todayWd = today ? weekdayOf(today) : -1;
  const phone = settings?.phone ?? "01718-768931";
  const telHref = `tel:+880${phone.replace(/[^0-9]/g, "").replace(/^0/, "")}`;
  const waHref = `https://wa.me/${settings?.whatsapp ?? "8801718768931"}`;
  const mapUrl = settings?.mapUrl ?? "https://www.google.com/maps/search/?api=1&query=Abrar+Active+Dental+Kalshi+Mor+Mirpur-12+Dhaka";
  const address = lang === "bn"
    ? settings?.addressBn ?? "বাড়ি #৭৫, ব্লক #ই, রোড #২, কালশী মোড়, মিরপুর-১২, ঢাকা ১২১৬"
    : settings?.addressEn ?? "House #75, Block #E, Road #2, Kalshi Mor, Mirpur-12, Dhaka 1216";

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-teal/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-leaf/10" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-14 sm:px-6 md:grid-cols-2 md:pb-24 md:pt-20">
          <div>
            <p data-enter className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-semibold text-teal">
              <ToothMark className="h-3.5 w-3.5" />
              {t("hero.kicker")}
            </p>
            <h1 data-enter className="mt-5 text-[42px] font-bold leading-[1.08] tracking-tight sm:text-6xl">
              {t("hero.title")}{" "}
              <span className="text-teal">{t("hero.titleAccent")}</span>
            </h1>
            <p data-enter className="mt-5 max-w-lg text-lg leading-relaxed text-ink/70">
              {t("hero.sub")}
            </p>

            <div data-enter className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/book" className="btn-step rounded-full bg-teal px-6 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-teal/25 hover:bg-teal-deep">
                {t("hero.book")}
              </Link>
              <a href={telHref} className="btn-step rounded-full border-2 border-ink bg-white px-6 py-3 text-[15px] font-semibold text-ink hover:border-teal hover:text-teal">
                {t("hero.call")}
              </a>
            </div>

            <div data-enter className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-ink/70">
              <span className="inline-flex items-center gap-1.5">
                <span className="text-leaf">★★★★★</span> {t("hero.fact")}
              </span>
              {hours && hours.todayText && (
                <span className="inline-flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${hours.openNow ? "bg-leaf" : "bg-coral"}`} />
                  {hours.openNow ? t("hours.openNow") : t("hours.closedNow")} · {hours.todayText}
                </span>
              )}
            </div>
          </div>

          <div data-enter-art className="relative mx-auto w-full max-w-md">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-line shadow-xl shadow-teal/10">
              <Image
                src="/images/hero-clinic.jpg"
                alt="Abrar Active Dental clinic"
                width={1600}
                height={893}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
            <div className="absolute -left-3 top-8 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg sm:-left-6">
              <p className="text-lg font-bold leading-none text-teal">{lang === "bn" ? "১০০%" : "100%"}</p>
              <p className="mt-1 text-xs font-medium text-muted">{t("trust.recommend")}</p>
            </div>
            <div className="absolute -bottom-4 right-2 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg sm:-right-4">
              <p className="text-sm font-bold leading-none">{t("doctor.name")}</p>
              <p className="mt-1 text-xs font-medium text-muted">{t("doctor.role")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- TRUST BAR ---------- */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-7 sm:px-6 md:grid-cols-4">
          {[
            { big: lang === "bn" ? "১০০%" : "100%", small: t("trust.recommend") },
            { big: "5", small: t("trust.reviews") },
            { big: lang === "bn" ? "১০" : "10", small: t("nav.services") },
            { big: lang === "bn" ? "৭ দিন" : "7 days", small: t("hours.opening") },
          ].map((s) => (
            <div key={s.small} className="text-center md:text-left">
              <p className="text-2xl font-bold text-teal">{s.big}</p>
              <p className="mt-1 text-[13px] font-medium text-muted">{s.small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- SERVICES ---------- */}
      <section id="services" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("services.title")}</h2>
            <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink/65">{t("services.sub")}</p>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(services ?? []).filter((s) => s.active).map((s, i) => (
              <Reveal key={s.id} delay={(i % 3) * 0.08}>
                <article className="card-lift flex h-full flex-col rounded-3xl border border-line bg-white p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mist text-teal">
                    <ToothMark className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{lang === "bn" ? s.nameBn : s.nameEn}</h3>
                  <p className="mt-1.5 flex-1 text-[15px] leading-relaxed text-ink/60">
                    {lang === "bn" ? s.descBn : s.descEn}
                  </p>
                  <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
                    <div>
                      <p className="text-xs font-medium text-muted">{t("services.starting")}</p>
                      <p className="text-xl font-bold text-ink">
                        {fmtMoney(s.price, lang)}
                        <span className="ml-2 text-sm font-medium text-muted">
                          · {bnDigits(s.durationMin, lang)} {t("services.min")}
                        </span>
                      </p>
                    </div>
                    <Link href={`/book?service=${s.id}`} className="btn-step rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-teal">
                      {t("services.book")}
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="mt-6 text-sm text-muted">{t("services.note")}</p>
          </Reveal>
        </div>
      </section>

      {/* ---------- HOW BOOKING WORKS ---------- */}
      <section id="how" className="scroll-mt-20 border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("how.title")}</h2>
            <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink/65">{t("how.sub")}</p>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { n: "1", title: t("how.1t"), desc: t("how.1d") },
              { n: "2", title: t("how.2t"), desc: t("how.2d") },
              { n: "3", title: t("how.3t"), desc: t("how.3d") },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div className="card-lift h-full rounded-3xl border border-line bg-mist p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-teal text-lg font-bold text-white">
                    {bnDigits(s.n, lang)}
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ink/60">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- DOCTOR ---------- */}
      <section id="doctor" className="scroll-mt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-24">
          <Reveal>
            <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-line bg-teal text-white shadow-xl shadow-teal/20">
              <Image
                src="/images/doctor-arifa.jpg"
                alt="Dr. Arifa Rahman, Dental Surgeon"
                width={1200}
                height={896}
                className="h-72 w-full object-cover"
              />
              <div className="p-8 pt-6">
              <p className="text-center text-2xl font-bold">{t("doctor.name")}</p>
              <p className="mt-1 text-center text-sm font-medium text-white/75">{t("doctor.role")} · Abrar Active Dental</p>
              <div className="mt-6 flex justify-center gap-2">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">BDS</span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Mirpur-12</span>
              </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("doctor.title")}</h2>
              <p className="mt-5 text-[17px] leading-relaxed text-ink/70">{t("doctor.bio1")}</p>
              <p className="mt-3 text-[17px] leading-relaxed text-ink/70">{t("doctor.bio2")}</p>
              <ul className="mt-6 space-y-3">
                {[t("doctor.p1"), t("doctor.p2"), t("doctor.p3")].map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[15px] font-medium text-ink/80">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-leaf/15 text-leaf">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
              <Link href="/book" className="btn-step mt-8 inline-block rounded-full bg-teal px-6 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-teal/25 hover:bg-teal-deep">
                {t("doctor.cta")}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- REVIEWS ---------- */}
      <section id="reviews" className="scroll-mt-20 border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("reviews.title")}</h2>
            <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink/65">{t("reviews.sub")}</p>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[
              { name: "MD Jahid", text: "Good Service, I'm satisfied for dental treatment, Environment also well" },
              { name: "Ariful Islam Alim", text: "very good surgeon" },
            ].map((r, i) => (
              <Reveal key={r.name} delay={i * 0.1}>
                <figure className="card-lift h-full rounded-3xl border border-line bg-mist p-7">
                  <div className="text-lg tracking-wide text-leaf">★★★★★</div>
                  <blockquote className="mt-3 text-lg font-medium leading-relaxed text-ink/85">“{r.text}”</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-teal text-sm font-bold text-white">
                      {r.name.charAt(0)}
                    </span>
                    <span className="text-sm font-semibold">{r.name}</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- PHOTO GALLERY ---------- */}
      <section aria-label="Clinic photos">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
          <Reveal>
            <div className="grid gap-5 sm:grid-cols-3">
              <Image src="/images/smile-closeup.jpg" alt="Bright healthy smile" width={1200} height={896} className="h-64 w-full rounded-3xl border border-line object-cover sm:h-72" />
              <Image src="/images/child-care.jpg" alt="Children's dental care" width={1200} height={896} className="h-64 w-full rounded-3xl border border-line object-cover sm:h-72" />
              <Image src="/images/whitening-smile.jpg" alt="Teeth whitening result" width={1200} height={896} className="h-64 w-full rounded-3xl border border-line object-cover sm:h-72" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- HOURS + LOCATION + CONTACT ---------- */}
      <section id="visit" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("hours.title")}</h2>
            <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink/65">{t("hours.sub")}</p>
          </Reveal>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <Reveal>
              <div className="h-full rounded-3xl border border-line bg-white p-7">
                <h3 className="text-lg font-bold">{t("hours.opening")}</h3>
                <ul className="mt-4 space-y-2.5 text-[15px]">
                  {WEEKDAYS_EN.map((d, i) => {
                    const wins = settings?.hours[String(i)] ?? [];
                    const label = lang === "bn" ? WEEKDAYS_BN[i] : d;
                    const val = !settings ? "" : wins.length === 0 ? "—" : wins.map((w) => `${bnDigits(w.open, lang)}–${bnDigits(w.close, lang)}`).join("  ·  ");
                    const isToday = i === todayWd;
                    return (
                      <li key={d} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${isToday ? "bg-mist font-semibold text-teal" : "text-ink/75"}`}>
                        <span>
                          {label}
                          {isToday && <span className="ml-2 rounded-full bg-teal px-2 py-0.5 text-[11px] font-bold text-white">{t("hours.today")}</span>}
                        </span>
                        <span className="whitespace-nowrap text-right">{val}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 rounded-xl bg-mist px-3 py-2 text-sm font-medium text-teal">{t("hours.fridayNote")}</p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex h-full flex-col rounded-3xl border border-line bg-white p-7">
                <h3 className="text-lg font-bold">{t("hours.address")}</h3>
                <p className="mt-4 text-[16px] leading-relaxed text-ink/75">{address}</p>
                <a href={mapUrl} target="_blank" rel="noreferrer" className="btn-step mt-6 inline-block self-start rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal">
                  {t("hours.map")} →
                </a>
                <div className="mt-auto pt-8">
                  <div className="flex items-center gap-3 rounded-2xl bg-mist p-4">
                    <Molar className="h-10 w-10 shrink-0" />
                    <p className="text-sm font-medium leading-snug text-ink/70">
                      {lang === "bn" ? "কালশী মোড়, মিরপুর-১২" : "Kalshi Mor, Mirpur-12"}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="flex h-full flex-col rounded-3xl border border-line bg-ink p-7 text-white">
                <h3 className="text-lg font-bold">{t("hours.contact")}</h3>
                <ul className="mt-4 space-y-4 text-[15px]">
                  <li>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{t("hours.call")}</p>
                    <a href={telHref} className="mt-1 block text-lg font-bold hover:text-[#7fd8d6]">{phone}</a>
                  </li>
                  <li>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{t("hours.whatsapp")}</p>
                    <a href={waHref} target="_blank" rel="noreferrer" className="mt-1 block font-semibold hover:text-[#7fd8d6]">WhatsApp · {phone}</a>
                  </li>
                  <li>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{t("hours.email")}</p>
                    <a href={`mailto:${settings?.email ?? "dr.arifa1bds@gmail.com"}`} className="mt-1 block break-all font-semibold hover:text-[#7fd8d6]">
                      {settings?.email ?? "dr.arifa1bds@gmail.com"}
                    </a>
                  </li>
                </ul>
                <Link href="/book" className="btn-step mt-8 inline-block rounded-full bg-teal px-5 py-3 text-center text-sm font-semibold text-white hover:bg-white hover:text-ink">
                  {t("hero.book")}
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
