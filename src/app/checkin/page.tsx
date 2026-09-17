"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSavedMember, clearMember } from "@/lib/memberStorage";
import WeekCard from "@/components/WeekCard";
import { WeekSummary } from "@/lib/types";
import { todayLocalDateString } from "@/lib/clientDate";

type ViewState = "loading" | "ready" | "already" | "success" | "no-member";

export default function CheckinPage() {
  const router = useRouter();
  const [memberName, setMemberName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [view, setView] = useState<ViewState>("loading");
  const [currentWeek, setCurrentWeek] = useState<WeekSummary | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [todayStr, setTodayStr] = useState<string>();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadMyData = useCallback(async (id: string) => {
    const res = await fetch(`/api/my?member_id=${id}`);
    if (!res.ok) {
      if (res.status === 404) {
        clearMember();
        router.replace("/");
      }
      return;
    }
    const data = await res.json();
    const week = (data.weeks as WeekSummary[]).find((w) => w.isCurrent) ?? data.weeks[0];
    setCurrentWeek(week);
    setWeeklyGoal(data.event.weekly_goal);
    setView(data.checkedInToday ? "already" : "ready");
  }, [router]);

  useEffect(() => {
    const m = getSavedMember();
    if (!m) {
      router.replace("/");
      return;
    }
    setMemberName(m.name);
    setMemberId(m.id);
    setTodayStr(todayLocalDateString()); // 표시용, 실제 출석 판정은 서버에서 처리
    loadMyData(m.id);
  }, [loadMyData, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 4) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId, code }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setView("success");
        await loadMyData(memberId);
      } else if (data.status === "already") {
        setView("already");
        await loadMyData(memberId);
      } else {
        setError(data.message ?? "오류가 발생했습니다.");
        setCode("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (view === "loading") {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="font-bold text-[var(--color-ink-soft)]">불러오는 중…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col">
      <div className="container-app w-full px-5 pt-8 pb-14 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="eyebrow">CHECK-IN</p>
            <h1 className="text-2xl font-black mt-0.5">{memberName}님</h1>
          </div>
          <Link
            href="/my"
            className="text-sm font-bold text-[var(--color-ink-soft)] underline underline-offset-4"
          >
            내 현황 →
          </Link>
        </div>

        {view === "ready" && (
          <form onSubmit={submit} className="card p-6 space-y-4">
            <p className="text-lg font-black leading-snug">
              스튜디오 TV/데스크에 표시된
              <br />
              지금 코드 4자리를 입력하세요
            </p>
            <input
              className="input-field text-center text-4xl tracking-[0.4em] font-black h-20"
              inputMode="numeric"
              maxLength={4}
              value={code}
              autoFocus
              onChange={(e) => {
                setError("");
                setCode(e.target.value.replace(/\D/g, "").slice(0, 4));
              }}
              placeholder="0000"
            />
            {error && (
              <p className="text-sm font-bold text-[var(--color-accent-dark)] text-center">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={code.length !== 4 || submitting}
              className="btn btn-accent w-full h-14 text-lg"
            >
              {submitting ? "확인 중…" : "오늘 출석하기"}
            </button>
          </form>
        )}

        {view === "already" && (
          <div className="card p-6 text-center">
            <p className="text-4xl mb-2">✅</p>
            <p className="text-xl font-black mb-1">오늘 출석은 이미 완료되었습니다!</p>
            <p className="text-sm text-[var(--color-ink-soft)] font-semibold">
              내일 또 만나요 💪
            </p>
          </div>
        )}

        {view === "success" && (
          <div className="card p-6 text-center">
            <p className="text-5xl mb-2">🎉</p>
            <p className="text-xl font-black mb-1">출석 완료!</p>
            <p className="text-sm text-[var(--color-ink-soft)] font-semibold">
              오늘도 KEEP THE PACE 🔥
            </p>
          </div>
        )}

        {currentWeek && (
          <div className="mt-6">
            <WeekCard week={currentWeek} weeklyGoal={weeklyGoal} todayStr={todayStr} featured />
          </div>
        )}

        <Link
          href="/my"
          className="btn btn-outline w-full h-12 mt-6 text-sm"
        >
          주차별 출석 기록 전체 보기
        </Link>
      </div>
    </main>
  );
}
