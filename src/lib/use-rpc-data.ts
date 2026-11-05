"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "./toast";
import { useLang } from "./lang-context";

export const AUTO_REFRESH_SECONDS = 20;

// Loads data, auto-refreshes every 20s (paused while the tab is hidden) and
// shows a toast when a refresh returns different data.
export function useRpcData<T>(fetcher: () => Promise<T>, key: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const { t } = useLang();
  const tRef = useRef(t);
  tRef.current = t;
  const prevSig = useRef<string | null>(null);
  const generation = useRef(0);

  const load = useCallback(async () => {
    const gen = generation.current;
    try {
      const d = await fetcherRef.current();
      if (gen !== generation.current) return; // a newer key replaced this request
      const sig = JSON.stringify(d, (k, v) => (k === "generated_at" ? undefined : v));
      if (prevSig.current !== null && prevSig.current !== sig) toastRef.current(tRef.current.common.dataUpdated);
      prevSig.current = sig;
      setData(d);
      setError(null);
      setUpdated(new Date());
    } catch (e) {
      if (gen !== generation.current) return;
      setError(e instanceof Error ? e.message : tRef.current.common.somethingWrong);
    }
  }, []);

  useEffect(() => {
    if (key === null) return;
    generation.current += 1;
    prevSig.current = null;
    setData(null);
    setError(null);
    load();
    const id = setInterval(() => {
      if (!document.hidden) load();
    }, AUTO_REFRESH_SECONDS * 1000);
    const onVisible = () => {
      if (!document.hidden) load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [key, load]);

  return { data, error, updated, reload: load };
}
