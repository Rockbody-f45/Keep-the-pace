import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { getActiveEvent } from "@/lib/getEvent";
import { getAllMembers, getAllCheckins, groupCheckinsByMember } from "@/lib/adminData";
import { allWeekIndices, currentWeekIndex, weekDays, formatWeekLabel } from "@/lib/weeks";

function csvEscape(v: string | number): string {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const scope = req.nextUrl.searchParams.get("scope"); // "success" | null

  const [event, members, checkins] = await Promise.all([
    getActiveEvent(),
    getAllMembers(),
    getAllCheckins(),
  ]);
  const checkinsByMember = groupCheckinsByMember(checkins);

  const curIdx = currentWeekIndex(event.start_date, event.end_date);
  const weekIndices = allWeekIndices(event.start_date, event.end_date).filter(
    (w) => w <= curIdx
  );

  const header = [
    "이름",
    "전화번호 뒤4자리",
    "NRC 이름",
    "NRC 참여 여부",
    "주차",
    "주차 기간",
    "월",
    "화",
    "수",
    "목",
    "금",
    "토",
    "총 출석",
    "성공 여부",
  ];

  const rows: string[] = [header.map(csvEscape).join(",")];

  for (const weekIndex of weekIndices) {
    const days = weekDays(weekIndex, event.start_date);
    const label = formatWeekLabel(weekIndex, event.start_date);
    const weekEnd = days[days.length - 1];

    for (const m of members) {
      if (m.created_at.slice(0, 10) > weekEnd) continue; // 그 주차 시작 전 등록자는 제외

      const dates = new Set(checkinsByMember.get(m.id) ?? []);
      const flags = days.map((d) => dates.has(d));
      const count = flags.filter(Boolean).length;
      const success = count >= event.weekly_goal;

      if (scope === "success" && !success) continue;

      rows.push(
        [
          m.name,
          m.phone_last4,
          m.nrc_name ?? "",
          m.nrc_joined ? "참여" : "미참여",
          `WEEK ${weekIndex}`,
          label,
          ...flags.map((f) => (f ? "O" : "X")),
          count,
          success ? "SUCCESS" : "FAIL",
        ]
          .map(csvEscape)
          .join(",")
      );
    }
  }

  const csv = "﻿" + rows.join("\n");
  const filename = `keep-the-pace_${scope === "success" ? "success_" : ""}${event.start_date}_${event.end_date}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
