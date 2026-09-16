import { WeekSummary } from "@/lib/types";
import StampRow from "./StampRow";

type Props = {
  week: WeekSummary;
  weeklyGoal: number;
  todayStr?: string;
  featured?: boolean;
};

function statusMessage(week: WeekSummary, weeklyGoal: number) {
  const remaining = weeklyGoal - week.count;
  if (week.success) {
    return week.count > weeklyGoal
      ? `🎉 이번 주 미션 성공! (총 ${week.count}회 출석)`
      : "🎉 이번 주 미션 성공!";
  }
  if (week.isFuture) return "아직 시작 전이에요";
  if (remaining === 1) return "🔥 한 번만 더 나오면 이번 주 성공!";
  if (remaining <= 0) return "🎉 이번 주 미션 성공!";
  return `🔥 이번 주 성공까지 ${remaining}번 남았어요!`;
}

export default function WeekCard({ week, weeklyGoal, todayStr, featured }: Props) {
  if (featured) {
    return (
      <div className="card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="eyebrow">
              {week.isCurrent ? "이번 주" : `WEEK ${week.weekIndex}`}
            </p>
            <p className="text-sm font-semibold text-[var(--color-ink-soft)] mt-0.5">
              {week.label}
            </p>
          </div>
          {week.success && <span className="badge-success">SUCCESS</span>}
        </div>

        <StampRow days={week.days} attendedDays={week.attendedDays} todayStr={todayStr} />

        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold text-[var(--color-ink-soft)] mb-1">
              이번 주 출석
            </p>
            <p className="text-4xl font-black tracking-tight">
              {week.count}
              <span className="text-xl text-[var(--color-ink-soft)]"> / {weeklyGoal}</span>
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm font-bold">{statusMessage(week, weeklyGoal)}</p>
      </div>
    );
  }

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-black tracking-wide text-[var(--color-ink-soft)]">
            WEEK {week.weekIndex}
          </p>
          <p className="text-sm font-bold mt-0.5">{week.label}</p>
        </div>
        {week.isFuture ? (
          <span className="badge-fail">예정</span>
        ) : week.success ? (
          <span className="badge-success">✅ SUCCESS</span>
        ) : (
          <span className="badge-fail">
            {week.count} / {weeklyGoal}
          </span>
        )}
      </div>
      <StampRow days={week.days} attendedDays={week.attendedDays} todayStr={todayStr} size="sm" />
    </div>
  );
}
