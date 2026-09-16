import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayDateStringKST } from "@/lib/dailyCode";

/** 관리자 수동 출석 추가 — QR 체크인을 깜빡했지만 실제 방문이 확인된 경우 */
export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const memberId = typeof body?.member_id === "string" ? body.member_id : "";
  const checkinDate =
    typeof body?.checkin_date === "string" && body.checkin_date
      ? body.checkin_date
      : todayDateStringKST();
  const note = typeof body?.note === "string" ? body.note.trim() : null;

  if (!memberId) {
    return NextResponse.json({ error: "member_id가 필요합니다." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("checkins")
    .insert({ member_id: memberId, checkin_date: checkinDate, source: "admin", note })
    .select("*")
    .single();

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "해당 날짜에 이미 출석 기록이 있습니다." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ checkin: data });
}
