import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveEvent } from "@/lib/getEvent";
import { buildWeekSummaries } from "@/lib/weeks";
import { todayDateStringKST } from "@/lib/dailyCode";

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get("member_id");
  if (!memberId) {
    return NextResponse.json({ error: "member_id가 필요합니다." }, { status: 400 });
  }

  const admin = createAdminClient();

  const [{ data: member, error: memberError }, event] = await Promise.all([
    admin
      .from("members")
      .select("id, name, phone_last4, nrc_joined, nrc_name")
      .eq("id", memberId)
      .maybeSingle(),
    getActiveEvent(),
  ]);

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }
  if (!member) {
    return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: checkins, error: checkinError } = await admin
    .from("checkins")
    .select("checkin_date")
    .eq("member_id", memberId)
    .order("checkin_date", { ascending: true });

  if (checkinError) {
    return NextResponse.json({ error: checkinError.message }, { status: 500 });
  }

  const attendedDates = (checkins ?? []).map((c) => c.checkin_date as string);
  const weeks = buildWeekSummaries(
    event.start_date,
    event.end_date,
    event.weekly_goal,
    attendedDates
  );

  const today = todayDateStringKST();
  const checkedInToday = attendedDates.includes(today);

  return NextResponse.json({
    member,
    event: {
      name: event.name,
      start_date: event.start_date,
      end_date: event.end_date,
      weekly_goal: event.weekly_goal,
    },
    weeks,
    checkedInToday,
  });
}
