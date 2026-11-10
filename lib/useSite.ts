"use client";

import { useEffect, useState } from "react";
import type { Service, Settings } from "@/lib/types";

let servicesCache: Service[] | null = null;
let settingsCache: Settings | null = null;
let servicesPromise: Promise<Service[]> | null = null;
let settingsPromise: Promise<Settings> | null = null;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export function useServices() {
  const [services, setServices] = useState<Service[] | null>(servicesCache);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (servicesCache) return;
    if (!servicesPromise) {
      servicesPromise = fetchJson<Service[]>("/api/services").then((s) => {
        servicesCache = s;
        return s;
      });
    }
    servicesPromise.then(setServices).catch(() => setError(true));
  }, []);
  return { services, error };
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(settingsCache);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (settingsCache) return;
    if (!settingsPromise) {
      settingsPromise = fetchJson<Settings>("/api/settings").then((s) => {
        settingsCache = s;
        return s;
      });
    }
    settingsPromise.then(setSettings).catch(() => setError(true));
  }, []);
  return { settings, error };
}

/** Bust the module cache after the admin edits data. */
export function bustSiteCache() {
  servicesCache = null;
  settingsCache = null;
  servicesPromise = null;
  settingsPromise = null;
}
