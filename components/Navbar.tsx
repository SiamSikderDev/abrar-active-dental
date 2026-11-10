"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { useSettings } from "@/lib/useSite";
import Molar from "./Molar";

export default function Navbar() {
  const { lang, setLang, t } = useLang();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const phone = settings?.phone ?? "01718-768931";
  const telHref = `tel:+880${phone.replace(/[^0-9]/g, "").replace(/^0/, "")}`;

  const links = [
    { href: isHome ? "#services" : "/#services", label: t("nav.services") },
    { href: isHome ? "#how" : "/#how", label: t("nav.how") },
    { href: isHome ? "#doctor" : "/#doctor", label: t("nav.doctor") },
    { href: isHome ? "#reviews" : "/#reviews", label: t("nav.reviews") },
    { href: isHome ? "#visit" : "/#visit", label: t("nav.hours") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="Abrar Active Dental">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal text-white shadow-sm">
            <Molar className="h-6 w-6" tooth="#ffffff" outline="#ffffff" cheek="#ffffff" />
          </span>
          <span className="leading-none">
            <span className="block text-[17px] font-bold tracking-tight">
              <span className="text-ink">ABRAR</span>{" "}
              <span className="text-coral">ACTIVE</span>{" "}
              <span className="text-teal">DENTAL</span>
            </span>
            <span className="mt-1 block text-[11px] font-medium tracking-wide text-muted">
              {lang === "bn" ? "মানসম্মত দাঁতের চিকিৎসা" : "Quality Dentistry"}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {links.map((l) => (
            <a key={l.href + l.label} href={l.href} className="link-underline text-sm font-medium text-ink/80 hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-line bg-mist text-sm font-semibold" role="group" aria-label="Language">
            <button
              type="button"
              onClick={() => setLang("bn")}
              className={`px-3 py-1.5 transition-colors ${lang === "bn" ? "bg-teal text-white" : "text-ink/70 hover:text-ink"}`}
              aria-pressed={lang === "bn"}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 transition-colors ${lang === "en" ? "bg-teal text-white" : "text-ink/70 hover:text-ink"}`}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
          </div>

          <a href={telHref} className="btn-step hidden rounded-full border border-teal px-3.5 py-2 text-sm font-semibold text-teal md:inline-block">
            {t("nav.call")}
          </a>
          <Link href="/book" className="btn-step hidden rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-deep sm:inline-block">
            {t("nav.book")}
          </Link>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-white px-4 py-3 lg:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href + l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink/85 hover:bg-mist"
              >
                {l.label}
              </a>
            ))}
            <Link href="/book" onClick={() => setOpen(false)} className="mt-2 rounded-full bg-teal px-4 py-2.5 text-center text-[15px] font-semibold text-white">
              {t("nav.book")}
            </Link>
            <a href={telHref} className="mt-2 rounded-full border border-teal px-4 py-2.5 text-center text-[15px] font-semibold text-teal">
              {t("nav.call")} · {phone}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
