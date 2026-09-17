import Link from "next/link";
import { getMembersWithCurrentWeek } from "@/lib/adminData";
import { getCurrentCode, todayDateStringKST, nextCodeChangeLabelKST } from "@/lib/dailyCode";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { event, members } = await getMembersWithCurrentWeek();
  const today = todayDateStringKST();

  const day = new Date(today + "T00:00:00Z").getUTCDay();
  const todayIdx = day === 0 ? -1 : day - 1;
  const todayCheckins = todayIdx === -1 ? 0 : members.filter((m) => m.weekDayFlags[todayIdx]).length;

  const participants = members.length;
  const successList = members.filter((m) => m.weekSuccess);
  const weekSuccessCount = successList.length;
  const weekSuccessRate = participants > 0 ? Math.round((weekSuccessCount / participants) * 1000) / 10 : 0;

  const eventActive = today >= event.start_date && today <= event.end_date;
  const code = eventActive ? getCurrentCode() : null;
  const nextChange = nextCodeChangeLabelKST();

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">DASHBOARD</p>
        <h1 className="text-3xl font-black mt-1">{event.name}</h1>
        <p className="text-sm font-semibold text-[var(--color-ink-soft)] mt-1">
          {event.start_date} ~ {event.end_date} · 주당 목표 {event.weekly_goal}회
          {!eventActive && <span className="ml-2 text-[var(--color-accent)]">(기간 외)</span>}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="참여자" value={`${participants}명`} />
        <StatCard label="오늘 체크인" value={`${todayCheckins}명`} />
        <StatCard label="WEEK SUCCESS" value={`${weekSuccessCount}명`} accent />
        <StatCard label="달성률" value={`${weekSuccessRate}%`} />
      </div>

      <div className="grid lg:grid-cols-[1fr_20rem] gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="eyebrow">가장 자주 볼 화면</p>
              <h2 className="text-xl font-black mt-1">이번 주 성공자</h2>
            </div>
            <Link
              href="/admin/members?filter=success"
              className="text-sm font-bold text-[var(--color-ink-soft)] underline underline-offset-4"
            >
              전체 관리 →
            </Link>
          </div>

          {successList.length === 0 ? (
            <p className="text-sm font-semibold text-[var(--color-ink-soft)] py-6 text-center">
              아직 이번 주 성공자가 없습니다.
            </p>
          ) : (
            <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 list-decimal list-inside marker:font-bold marker:text-[var(--color-ink-soft)]">
              {successList.map((m) => (
                <li key={m.id} className="font-bold py-1 border-b border-[var(--color-line)]/70">
                  {m.name}
                  <span className="ml-2 text-xs font-semibold text-[var(--color-ink-soft)]">
                    {m.weekCount}회
                  </span>
                </li>
              ))}
            </ol>
          )}

          <p className="mt-4 text-sm font-black text-[var(--color-accent)]">
            총 {successList.length}명
          </p>
        </div>

        <div
          className="card p-6 flex flex-col items-center justify-center text-center"
          style={{ background: "var(--color-ink)" }}
        >
          <p className="text-xs font-bold tracking-[0.2em] text-white/60">CURRENT CODE</p>
          <p className="mt-3 text-6xl font-black tracking-[0.15em] text-white tabular-nums">
            {code ?? "----"}
          </p>
          <p className="mt-3 text-xs font-semibold text-white/60">
            {today} · {nextChange}에 다음 코드로 자동 변경
          </p>
          <Link
            href="/admin/today-code"
            className="mt-4 text-xs font-bold text-white underline underline-offset-4"
          >
            전체화면으로 보기 →
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-bold text-[var(--color-ink-soft)] mb-2">{label}</p>
      <p className={`text-3xl font-black ${accent ? "text-[var(--color-accent)]" : ""}`}>{value}</p>
    </div>
  );
}
