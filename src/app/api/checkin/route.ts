import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentCode, todayDateStringKST } from "@/lib/dailyCode";
import { getActiveEvent } from "@/lib/getEvent";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const memberId = typeof body?.member_id === "string" ? body.member_id : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  if (!memberId) {
    return NextResponse.json(
      { status: "error", message: "회원 정보를 찾을 수 없습니다. 다시 본인 확인을 해주세요." },
      { status: 400 }
    );
  }
  if (!/^\d{4}$/.test(code)) {
    return NextResponse.json(
      { status: "invalid_code", message: "지금 출석 코드 4자리를 입력해주세요." },
      { status: 400 }
    );
  }

  let event;
  try {
    event = await getActiveEvent();
  } catch (e) {
    return NextResponse.json(
      { status: "error", message: (e as Error).message },
      { status: 500 }
    );
  }

  const today = todayDateStringKST();
  if (today < event.start_date || today > event.end_date) {
    return NextResponse.json(
      {
        status: "event_inactive",
        message: "현재 진행 중인 이벤트 기간이 아닙니다.",
      },
      { status: 400 }
    );
  }

  const correctCode = getCurrentCode();
  if (code !== correctCode) {
    return NextResponse.json(
      { status: "invalid_code", message: "출석 코드가 올바르지 않습니다. 스튜디오에 표시된 지금 코드를 확인해주세요." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: member, error: memberError } = await admin
    .from("members")
    .select("id, name")
    .eq("id", memberId)
    .maybeSingle();

  if (memberError) {
    return NextResponse.json({ status: "error", message: memberError.message }, { status: 500 });
  }
  if (!member) {
    return NextResponse.json(
      { status: "error", message: "회원 정보를 찾을 수 없습니다. 다시 본인 확인을 해주세요." },
      { status: 404 }
    );
  }

  const { error: insertError } = await admin.from("checkins").insert({
    member_id: memberId,
    checkin_date: today,
    source: "member",
  });

  if (insertError) {
    // unique_violation → 오늘 이미 출석함
    if ((insertError as { code?: string }).code === "23505") {
      return NextResponse.json({
        status: "already",
        message: "오늘 출석은 이미 완료되었습니다!",
        checkin_date: today,
      });
    }
    return NextResponse.json({ status: "error", message: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    status: "ok",
    message: "출석이 기록되었습니다!",
    checkin_date: today,
  });
}
