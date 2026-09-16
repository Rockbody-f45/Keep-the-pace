"use client";

import { useEffect, useState } from "react";
import { EventSettings } from "@/lib/types";
import { WeeklyStatRow } from "@/lib/adminData";

export default function AdminSettingsPage() {
  const [event, setEvent] = useState<EventSettings | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [weeks, setWeeks] = useState<WeeklyStatRow[]>([]);
  const [loadingWeeks, setLoadingWeeks] = useState(true);

  async function loadSettings() {
    const res = await fetch("/api/admin/settings");
    const data = await res.json();
    setEvent(data.event);
    setName(data.event.name);
    setStartDate(data.event.start_date);
    setEndDate(data.event.end_date);
    setWeeklyGoal(data.event.weekly_goal);
  }

  async function loadWeeklyStats() {
    setLoadingWeeks(true);
    const res = await fetch("/api/admin/weekly-stats");
    const data = await res.json();
    setWeeks(data.weeks ?? []);
    setLoadingWeeks(false);
  }

  useEffect(() => {
    loadSettings();
    loadWeeklyStats();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, start_date: startDate, end_date: endDate, weekly_goal: weeklyGoal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장 중 오류가 발생했습니다.");
        return;
      }
      setEvent(data.event);
      setMessage("설정이 저장되었습니다.");
      loadWeeklyStats();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">SETTINGS</p>
        <h1 className="text-3xl font-black mt-1">이벤트 설정</h1>
      </div>

      <form onSubmit={save} className="card p-6 grid sm:grid-cols-2 gap-4 max-w-3xl">
        <label className="block sm:col-span-2">
          <span className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1.5">
            이벤트 이름
          </span>
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1.5">
            시작일
          </span>
          <input
            type="date"
            className="input-field"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1.5">
            종료일
          </span>
          <input
            type="date"
            className="input-field"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1.5">
            주당 목표 출석 횟수
          </span>
          <input
            type="number"
            min={1}
            max={6}
            className="input-field"
            value={weeklyGoal}
            onChange={(e) => setWeeklyGoal(Number(e.target.value))}
          />
        </label>

        <div className="sm:col-span-2 flex items-center gap-3 mt-1">
          <button type="submit" disabled={saving || !event} className="btn btn-primary h-11 px-6">
            {saving ? "저장 중…" : "저장하기"}
          </button>
          {message && <p className="text-sm font-bold text-[var(--color-success)]">{message}</p>}
          {error && <p className="text-sm font-bold text-[var(--color-accent-dark)]">{error}</p>}
        </div>
        <p className="sm:col-span-2 text-xs font-semibold text-[var(--color-ink-soft)]">
          시작일/주당 목표를 변경하면 모든 주차 구분과 성공 여부가 새 기준으로 즉시 재계산됩니다.
        </p>
      </form>

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <p className="eyebrow">WEEKLY STATS</p>
            <h2 className="text-xl font-black mt-1">주차별 통계</h2>
          </div>
          <div className="flex gap-2">
            <a href="/api/admin/export" className="btn btn-outline h-10 px-4 text-sm">
              전체 CSV 다운로드
            </a>
            <a href="/api/admin/export?scope=success" className="btn btn-primary h-10 px-4 text-sm">
              성공자 CSV 다운로드
            </a>
          </div>
        </div>

        {loadingWeeks ? (
          <p className="text-sm font-semibold text-[var(--color-ink-soft)] py-6 text-center">
            불러오는 중…
          </p>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-xs font-bold text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
                  <th className="py-2 pr-4">주차</th>
                  <th className="py-2 pr-4">기간</th>
                  <th className="py-2 pr-4">참여자</th>
                  <th className="py-2 pr-4">{weeklyGoal}회 이상 달성</th>
                  <th className="py-2 pr-4">달성률</th>
                </tr>
              </thead>
              <tbody>
                {weeks.map((w) => (
                  <tr key={w.weekIndex} className="border-b border-[var(--color-line)]/60">
                    <td className="py-2.5 pr-4 font-black">WEEK {w.weekIndex}</td>
                    <td className="py-2.5 pr-4 font-semibold text-[var(--color-ink-soft)]">{w.label}</td>
                    <td className="py-2.5 pr-4 font-bold">{w.participants}</td>
                    <td className="py-2.5 pr-4 font-bold">{w.achieved}</td>
                    <td className="py-2.5 pr-4 font-black text-[var(--color-accent)]">{w.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
