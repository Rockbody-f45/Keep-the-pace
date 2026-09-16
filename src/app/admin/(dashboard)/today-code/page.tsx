"use client";

import { useEffect, useState } from "react";

export default function TodayCodeFullscreenPage() {
  const [code, setCode] = useState("----");
  const [date, setDate] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/admin/today-code");
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setCode(data.code);
      setDate(data.date);
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[var(--color-ink)] flex flex-col items-center justify-center gap-6 z-50">
      <p className="text-sm sm:text-base font-bold tracking-[0.3em] text-white/50">
        KEEP THE PACE · TODAY&apos;S CODE
      </p>
      <p className="text-[5rem] sm:text-[10rem] font-black tracking-[0.15em] text-white tabular-nums leading-none">
        {code}
      </p>
      <p className="text-sm font-semibold text-white/50">{date}</p>
    </div>
  );
}
