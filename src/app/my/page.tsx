"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSavedMember, clearMember } from "@/lib/memberStorage";
import WeekCard from "@/components/WeekCard";
import { WeekSummary } from "@/lib/types";
import { todayLocalDateString } from "@/lib/clientDate";

export default function MyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [weeks, setWeeks] = useState<WeekSummary[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [nrc, setNrc] = useState<{ joined: boolean; name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalSuccessWeeks, setTotalSuccessWeeks] = useState(0);

  useEffect(() => {
    const m = getSavedMember();
    if (!m) {
      router.replace("/");
      return;
    }
    setName(m.name);
    (async () => {
      const res = await fetch(`/api/my?member_id=${m.id}`);
      if (!res.ok) {
        if (res.status === 404) {
          clearMember();
          router.replace("/");
        }
        setLoading(false);
        return;
      }
      const data = await res.json();
      setWeeks(data.weeks);
      setWeeklyGoal(data.event.weekly_goal);
      setNrc({ joined: data.member.nrc_joined, name: data.member.nrc_name });
      setTotalSuccessWeeks(
        (data.weeks as WeekSummary[]).filter((w: WeekSummary) => w.success).length
      );
      setLoading(false);
    })();
  }, [router]);

  const current = weeks.find((w) => w.isCurrent);
  const past = weeks.filter((w) => !w.isCurrent);

  return (
    <main className="flex-1 flex flex-col">
      <div className="container-app w-full px-5 pt-8 pb-16 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="eyebrow">MY RECORD</p>
            <h1 className="text-2xl font-black mt-0.5">{name}님의 출석 현황</h1>
          </div>
          <Link
            href="/checkin"
            className="text-sm font-bold text-[var(--color-ink-soft)] underline underline-offset-4"
          >
            출석하기 →
          </Link>
        </div>

        {loading && (
          <p className="font-bold text-[var(--color-ink-soft)] text-center py-10">
            불러오는 중…
          </p>
        )}

        {!loading && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="card p-4 text-center">
                <p className="text-xs font-bold text-[var(--color-ink-soft)] mb-1">성공한 주</p>
                <p className="text-3xl font-black">{totalSuccessWeeks}<span className="text-base text-[var(--color-ink-soft)]">주</span></p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs font-bold text-[var(--color-ink-soft)] mb-1">NRC 챌린지</p>
                <p className="text-lg font-black mt-1.5">
                  {nrc?.joined ? `참여 · ${nrc.name}` : "미참여"}
                </p>
              </div>
            </div>

            {current && (
              <div className="mb-8">
                <WeekCard
                  week={current}
                  weeklyGoal={weeklyGoal}
                  todayStr={todayLocalDateString()}
                  featured
                />
              </div>
            )}

            {past.length > 0 && (
              <div>
                <p className="eyebrow mb-3">주차별 기록</p>
                <div className="space-y-3">
                  {past.map((w) => (
                    <WeekCard key={w.weekIndex} week={w} weeklyGoal={weeklyGoal} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
