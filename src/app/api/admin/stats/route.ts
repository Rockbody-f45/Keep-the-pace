import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { getMembersWithCurrentWeek } from "@/lib/adminData";
import { getCurrentCode, todayDateStringKST } from "@/lib/dailyCode";

/** weekDays()의 월~토(0~5) 순서에서 오늘이 몇 번째 인덱스인지. 일요일이면 -1 */
function todayWeekdayIndex(todayStr: string): number {
  const day = new Date(todayStr + "T00:00:00Z").getUTCDay(); // 0=일 1=월 ... 6=토
  if (day === 0) return -1;
  return day - 1; // 월=0 ... 토=5
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { event, members } = await getMembersWithCurrentWeek();
  const today = todayDateStringKST();

  const todayIdx = todayWeekdayIndex(today);
  const todayCheckins =
    todayIdx === -1 ? 0 : members.filter((m) => m.weekDayFlags[todayIdx]).length;

  const weekSuccessCount = members.filter((m) => m.weekSuccess).length;
  const participants = members.length;
  const weekSuccessRate =
    participants > 0 ? Math.round((weekSuccessCount / participants) * 1000) / 10 : 0;

  const successList = members
    .filter((m) => m.weekSuccess)
    .map((m) => ({ id: m.id, name: m.name, weekCount: m.weekCount }));

  return NextResponse.json({
    participants,
    todayCheckins,
    weekSuccessCount,
    weekSuccessRate,
    successList,
    weeklyGoal: event.weekly_goal,
    todayCode: getCurrentCode(),
    today,
    event: {
      name: event.name,
      start_date: event.start_date,
      end_date: event.end_date,
    },
  });
}
