"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { useSettings } from "@/lib/useSite";
import Molar from "./Molar";

export default function Footer() {
  const { lang, t } = useLang();
  const { settings } = useSettings();
  const [year, setYear] = useState(2026);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  const phone = settings?.phone ?? "01718-768931";
  const email = settings?.email ?? "dr.arifa1bds@gmail.com";
  const address = lang === "bn" ? settings?.addressBn ?? "বাড়ি #৭৫, ব্লক #ই, রোড #২, কালশী মোড়, মিরপুর-১২, ঢাকা ১২১৬" : settings?.addressEn ?? "House #75, Block #E, Road #2, Kalshi Mor, Mirpur-12, Dhaka 1216";
  const telHref = `tel:+880${phone.replace(/[^0-9]/g, "").replace(/^0/, "")}`;
  const waHref = `https://wa.me/${settings?.whatsapp ?? "8801718768931"}`;

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-teal text-white">
              <Molar className="h-6 w-6" tooth="#ffffff" outline="#ffffff" cheek="#ffffff" />
            </span>
            <span className="text-[17px] font-bold tracking-tight">
              <span className="text-white">ABRAR</span> <span className="text-[#ff7a7a]">ACTIVE</span>{" "}
              <span className="text-[#7fd8d6]">DENTAL</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">{t("footer.tagline")}</p>
          <p className="mt-3 text-xs text-white/45">{t("footer.demoPrices")}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white/90">{t("footer.quick")}</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            <li><a href="/#services" className="hover:text-white">{t("nav.services")}</a></li>
            <li><a href="/#how" className="hover:text-white">{t("nav.how")}</a></li>
            <li><a href="/#doctor" className="hover:text-white">{t("nav.doctor")}</a></li>
            <li><a href="/#reviews" className="hover:text-white">{t("nav.reviews")}</a></li>
            <li><Link href="/book" className="hover:text-white">{t("nav.book")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white/90">{t("footer.contact")}</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            <li>{address}</li>
            <li><a href={telHref} className="hover:text-white">{phone}</a></li>
            <li><a href={waHref} target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp</a></li>
            <li><a href={`mailto:${email}`} className="hover:text-white">{email}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-white/50 sm:px-6">
          <span>© {year} Abrar Active Dental · {t("footer.rights")}</span>
          <Link href="/admin" className="hover:text-white">{t("nav.admin")}</Link>
        </div>
      </div>
    </footer>
  );
}
