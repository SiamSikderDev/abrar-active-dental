"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { bnDigits, useLang } from "@/lib/i18n";
import { bustSiteCache } from "@/lib/useSite";
import { dhakaTodayStr } from "@/lib/hours";
import type { Appointment, ApptStatus, Service, Settings } from "@/lib/types";

const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_BN = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
const STATUSES: ApptStatus[] = ["pending", "confirmed", "cancelled", "completed"];

const statusStyle: Record<ApptStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-leaf/15 text-leaf",
  cancelled: "bg-coral/10 text-coral",
  completed: "bg-teal/10 text-teal",
};

type Tab = "appts" | "services" | "settings";

export default function AdminPage() {
  const { lang, t } = useLang();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [tab, setTab] = useState<Tab>("appts");

  const [appts, setAppts] = useState<Appointment[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<ApptStatus | "">("");
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // "Today" is read on the client after mount so the prerender stays stable.
  const [todayStr, setTodayStr] = useState("");
  useEffect(() => {
    setTodayStr(dhakaTodayStr());
  }, []);

  const checkMe = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me");
      const data = await res.json();
      setAuthed(Boolean(data.ok));
    } catch {
      setAuthed(false);
    }
  }, []);

  useEffect(() => {
    checkMe();
  }, [checkMe]);

  const loadAppts = useCallback(async () => {
    const q = new URLSearchParams();
    if (filterDate) q.set("date", filterDate);
    if (filterStatus) q.set("status", filterStatus);
    const res = await fetch(`/api/appointments?${q.toString()}`);
    if (res.ok) setAppts(await res.json());
  }, [filterDate, filterStatus]);

  const loadServices = useCallback(async () => {
    const res = await fetch("/api/services?all=1");
    if (res.ok) setServices(await res.json());
  }, []);

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    if (res.ok) setSettings(await res.json());
  }, []);

  useEffect(() => {
    if (!authed) return;
    loadAppts();
    loadServices();
    loadSettings();
  }, [authed, loadAppts, loadServices, loadSettings]);

  const stats = useMemo(() => {
    const today = todayStr;
    return {
      today: appts.filter((a) => a.date === today && a.status !== "cancelled").length,
      pending: appts.filter((a) => a.status === "pending").length,
      confirmed: appts.filter((a) => a.status === "confirmed").length,
      total: appts.length,
    };
  }, [appts, todayStr]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(false);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setPassword("");
      setAuthed(true);
    } else {
      setLoginError(true);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  }

  async function setStatus(id: string, status: ApptStatus) {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadAppts();
  }

  async function deleteAppt(id: string) {
    if (!window.confirm(t("admin.deleteConfirm"))) return;
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    loadAppts();
  }

  async function saveServices() {
    setBusy(true);
    setSavedMsg(null);
    const res = await fetch("/api/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(services),
    });
    if (res.ok) {
      bustSiteCache();
      setSavedMsg(t("admin.saved"));
      loadServices();
    }
    setBusy(false);
  }

  async function saveSettings() {
    if (!settings) return;
    setBusy(true);
    setSavedMsg(null);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      bustSiteCache();
      setSavedMsg(t("admin.saved"));
    }
    setBusy(false);
  }

  if (authed === null) {
    return <div className="mx-auto max-w-6xl px-4 py-20 text-muted">{t("common.loading")}</div>;
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
        <div className="rounded-3xl border border-line bg-white p-8 shadow-lg shadow-teal/5">
          <h1 className="text-2xl font-bold tracking-tight">{t("admin.title")}</h1>
          <p className="mt-2 text-[15px] text-ink/60">{t("admin.loginSub")}</p>
          <form onSubmit={login} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-pw" className="text-sm font-semibold">{t("admin.password")}</label>
              <input
                id="admin-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-xl border-2 border-line px-4 py-3 text-[15px] outline-none focus:border-teal"
              />
            </div>
            {loginError && <p role="alert" className="rounded-xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral">{t("admin.wrong")}</p>}
            <button type="submit" className="btn-step w-full rounded-full bg-teal py-3.5 text-[15px] font-semibold text-white hover:bg-teal-deep">
              {t("admin.loginBtn")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{t("admin.title")}</h1>
        <button type="button" onClick={logout} className="btn-step rounded-full border-2 border-ink bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-coral hover:text-coral">
          {t("admin.logout")}
        </button>
      </div>

      {/* Stats */}
      <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: t("admin.today"), value: stats.today },
          { label: t("admin.pending"), value: stats.pending },
          { label: t("admin.confirmed"), value: stats.confirmed },
          { label: t("admin.total"), value: stats.total },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl border border-line bg-white p-5">
            <p className="text-3xl font-bold text-teal">{bnDigits(s.value, lang)}</p>
            <p className="mt-1 text-sm font-medium text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-2" role="tablist">
        {([
          ["appts", t("admin.tabs.appts")],
          ["services", t("admin.tabs.services")],
          ["settings", t("admin.tabs.settings")],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => { setTab(key); setSavedMsg(null); }}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold ${tab === key ? "bg-ink text-white" : "border border-line bg-white text-ink/70 hover:border-teal"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {savedMsg && <p className="mt-4 rounded-xl bg-leaf/10 px-4 py-3 text-sm font-semibold text-leaf">{savedMsg}</p>}

      {/* ---------- APPOINTMENTS ---------- */}
      {tab === "appts" && (
        <div className="mt-6 rounded-3xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold">
              {t("admin.filterDate")}
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="rounded-xl border-2 border-line px-3 py-2 text-sm outline-none focus:border-teal" />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              {t("admin.filterStatus")}
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ApptStatus | "")} className="rounded-xl border-2 border-line px-3 py-2 text-sm outline-none focus:border-teal">
                <option value="">{t("admin.all")}</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`admin.status.${s}` as never)}</option>
                ))}
              </select>
            </label>
            {(filterDate || filterStatus) && (
              <button type="button" onClick={() => { setFilterDate(""); setFilterStatus(""); }} className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink/70 hover:border-teal">
                {t("admin.allDates")}
              </button>
            )}
          </div>

          {appts.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-mist px-4 py-4 text-sm font-medium text-ink/70">{t("admin.noAppts")}</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                    <th className="pb-3 pr-3">{t("admin.colDate")}</th>
                    <th className="pb-3 pr-3">{t("admin.colTime")}</th>
                    <th className="pb-3 pr-3">{t("admin.colPatient")}</th>
                    <th className="pb-3 pr-3">{t("admin.colService")}</th>
                    <th className="pb-3 pr-3">{t("admin.colStatus")}</th>
                    <th className="pb-3">{t("admin.colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {appts.map((a) => (
                    <tr key={a.id} className="border-b border-line/70 align-top">
                      <td className="py-3.5 pr-3 font-semibold">{a.date}<br /><span className="text-xs font-medium text-muted">{a.ref}</span></td>
                      <td className="py-3.5 pr-3 font-semibold">{a.slot}</td>
                      <td className="py-3.5 pr-3">
                        <span className="font-semibold">{a.name}</span><br />
                        <span className="text-ink/60">{a.phone}</span>
                        {a.notes && <><br /><span className="text-xs text-ink/55">{a.notes}</span></>}
                      </td>
                      <td className="py-3.5 pr-3">{lang === "bn" ? a.serviceNameBn : a.serviceNameEn}<br /><span className="text-xs text-muted">৳{a.price} · {a.durationMin} {t("common.min")}</span></td>
                      <td className="py-3.5 pr-3">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[a.status]}`}>{t(`admin.status.${a.status}` as never)}</span>
                      </td>
                      <td className="py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {a.status === "pending" && (
                            <button type="button" onClick={() => setStatus(a.id, "confirmed")} className="rounded-full bg-leaf px-3 py-1.5 text-xs font-bold text-white">{t("admin.confirm")}</button>
                          )}
                          {a.status !== "completed" && a.status !== "cancelled" && (
                            <button type="button" onClick={() => setStatus(a.id, "completed")} className="rounded-full bg-teal px-3 py-1.5 text-xs font-bold text-white">{t("admin.complete")}</button>
                          )}
                          {a.status !== "cancelled" && (
                            <button type="button" onClick={() => setStatus(a.id, "cancelled")} className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">{t("admin.cancel")}</button>
                          )}
                          <button type="button" onClick={() => deleteAppt(a.id)} className="rounded-full bg-coral/10 px-3 py-1.5 text-xs font-bold text-coral">{t("admin.delete")}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------- SERVICES ---------- */}
      {tab === "services" && (
        <div className="mt-6">
          <p className="rounded-2xl bg-white border border-line px-4 py-3 text-sm text-ink/70">{t("admin.servicesSub")}</p>
          <div className="mt-4 space-y-4">
            {services.map((s, idx) => (
              <div key={s.id} className="rounded-3xl border border-line bg-white p-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm font-semibold">{t("admin.nameBn")}
                    <input value={s.nameBn} onChange={(e) => setServices(services.map((x, i) => i === idx ? { ...x, nameBn: e.target.value } : x))} className="mt-1 w-full rounded-xl border-2 border-line px-3 py-2 text-sm outline-none focus:border-teal" />
                  </label>
                  <label className="text-sm font-semibold">{t("admin.nameEn")}
                    <input value={s.nameEn} onChange={(e) => setServices(services.map((x, i) => i === idx ? { ...x, nameEn: e.target.value } : x))} className="mt-1 w-full rounded-xl border-2 border-line px-3 py-2 text-sm outline-none focus:border-teal" />
                  </label>
                  <label className="text-sm font-semibold">{t("admin.descBn")}
                    <input value={s.descBn} onChange={(e) => setServices(services.map((x, i) => i === idx ? { ...x, descBn: e.target.value } : x))} className="mt-1 w-full rounded-xl border-2 border-line px-3 py-2 text-sm outline-none focus:border-teal" />
                  </label>
                  <label className="text-sm font-semibold">{t("admin.descEn")}
                    <input value={s.descEn} onChange={(e) => setServices(services.map((x, i) => i === idx ? { ...x, descEn: e.target.value } : x))} className="mt-1 w-full rounded-xl border-2 border-line px-3 py-2 text-sm outline-none focus:border-teal" />
                  </label>
                  <label className="text-sm font-semibold">{t("admin.price")}
                    <input type="number" min={0} value={s.price} onChange={(e) => setServices(services.map((x, i) => i === idx ? { ...x, price: Number(e.target.value) || 0 } : x))} className="mt-1 w-full rounded-xl border-2 border-line px-3 py-2 text-sm outline-none focus:border-teal" />
                  </label>
                  <label className="text-sm font-semibold">{t("admin.duration")}
                    <input type="number" min={15} step={15} value={s.durationMin} onChange={(e) => setServices(services.map((x, i) => i === idx ? { ...x, durationMin: Number(e.target.value) || 30 } : x))} className="mt-1 w-full rounded-xl border-2 border-line px-3 py-2 text-sm outline-none focus:border-teal" />
                  </label>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input type="checkbox" checked={s.active} onChange={(e) => setServices(services.map((x, i) => i === idx ? { ...x, active: e.target.checked } : x))} className="h-4 w-4 accent-teal" />
                    {t("admin.active")}
                  </label>
                  <button type="button" onClick={() => setServices(services.filter((_, i) => i !== idx))} className="rounded-full bg-coral/10 px-3 py-1.5 text-xs font-bold text-coral">{t("admin.delete")}</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setServices([...services, { id: `svc-${Date.now()}`, nameBn: "", nameEn: "", descBn: "", descEn: "", price: 0, durationMin: 30, active: true }])}
              className="btn-step rounded-full border-2 border-ink bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-teal hover:text-teal"
            >
              + {t("admin.addService")}
            </button>
            <button type="button" onClick={saveServices} disabled={busy} className="btn-step rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white hover:bg-teal-deep disabled:opacity-60">
              {t("admin.saveServices")}
            </button>
          </div>
        </div>
      )}

      {/* ---------- SETTINGS ---------- */}
      {tab === "settings" && settings && (
        <div className="mt-6 rounded-3xl border border-line bg-white p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold">{t("admin.phone")}
              <input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className="mt-1 w-full rounded-xl border-2 border-line px-3 py-2.5 text-sm outline-none focus:border-teal" />
            </label>
            <label className="text-sm font-semibold">{t("admin.email")}
              <input value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} className="mt-1 w-full rounded-xl border-2 border-line px-3 py-2.5 text-sm outline-none focus:border-teal" />
            </label>
            <label className="text-sm font-semibold">{t("admin.addressBn")}
              <input value={settings.addressBn} onChange={(e) => setSettings({ ...settings, addressBn: e.target.value })} className="mt-1 w-full rounded-xl border-2 border-line px-3 py-2.5 text-sm outline-none focus:border-teal" />
            </label>
            <label className="text-sm font-semibold">{t("admin.addressEn")}
              <input value={settings.addressEn} onChange={(e) => setSettings({ ...settings, addressEn: e.target.value })} className="mt-1 w-full rounded-xl border-2 border-line px-3 py-2.5 text-sm outline-none focus:border-teal" />
            </label>
          </div>

          <h3 className="mt-8 text-lg font-bold">{t("admin.hours")}</h3>
          <div className="mt-4 space-y-3">
            {WEEKDAYS_EN.map((d, i) => {
              const wins = settings.hours[String(i)] ?? [];
              const setWin = (wi: number, field: "open" | "close", val: string) => {
                const next = [...wins];
                while (next.length <= wi) next.push({ open: "", close: "" });
                next[wi] = { ...next[wi], [field]: val };
                const cleaned = next.filter((w) => w.open || w.close).map((w) => ({ open: w.open || "10:00", close: w.close || "13:00" }));
                setSettings({ ...settings, hours: { ...settings.hours, [String(i)]: cleaned } });
              };
              const labels = [t("admin.morning"), t("admin.evening")];
              return (
                <div key={d} className="grid items-center gap-3 rounded-2xl bg-mist p-4 md:grid-cols-[140px_1fr_1fr]">
                  <span className="font-bold">{lang === "bn" ? WEEKDAYS_BN[i] : d}</span>
                  {[0, 1].map((wi) => (
                    <div key={wi} className="flex items-center gap-2 text-sm">
                      <span className="w-14 font-medium text-muted">{labels[wi]}</span>
                      <input type="time" value={wins[wi]?.open ?? ""} onChange={(e) => setWin(wi, "open", e.target.value)} className="rounded-lg border border-line px-2 py-1.5 outline-none focus:border-teal" />
                      <span className="text-muted">{t("admin.to")}</span>
                      <input type="time" value={wins[wi]?.close ?? ""} onChange={(e) => setWin(wi, "close", e.target.value)} className="rounded-lg border border-line px-2 py-1.5 outline-none focus:border-teal" />
                    </div>
                  ))}
                  {wins.length === 0 && <span className="text-sm font-semibold text-coral">{t("admin.closed")}</span>}
                </div>
              );
            })}
          </div>

          <button type="button" onClick={saveSettings} disabled={busy} className="btn-step mt-6 rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white hover:bg-teal-deep disabled:opacity-60">
            {t("admin.saveSettings")}
          </button>
        </div>
      )}
    </div>
  );
}
