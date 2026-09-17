"use client";

import { useEffect, useState } from "react";

export default function TodayCodeFullscreenPage() {
  const [code, setCode] = useState("----");
  const [date, setDate] = useState("");
  const [nextChangeAt, setNextChangeAt] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/admin/today-code");
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setCode(data.code);
      setDate(data.date);
      setNextChangeAt(data.nextChangeAt);
    }
    load();
    // 코드는 매 정시에 바뀌므로, 정시 전환을 놓치지 않도록 20초마다 갱신
    const interval = setInterval(load, 20_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[var(--color-ink)] flex flex-col items-center justify-center gap-6 z-50">
      <p className="text-sm sm:text-base font-bold tracking-[0.3em] text-white/50">
        KEEP THE PACE · CURRENT CODE
      </p>
      <p className="text-[5rem] sm:text-[10rem] font-black tracking-[0.15em] text-white tabular-nums leading-none">
        {code}
      </p>
      <p className="text-sm font-semibold text-white/50">
        {date}
        {nextChangeAt && ` · ${nextChangeAt}에 자동 변경`}
      </p>
    </div>
  );
}
