import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { getMembersWithCurrentWeek } from "@/lib/adminData";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const filter = req.nextUrl.searchParams.get("filter") ?? "all";
  const search = (req.nextUrl.searchParams.get("search") ?? "").trim().toLowerCase();

  const { event, members } = await getMembersWithCurrentWeek();

  let result = members;
  if (filter === "success") result = result.filter((m) => m.weekSuccess);
  if (filter === "fail") result = result.filter((m) => !m.weekSuccess);
  if (filter === "nrc") result = result.filter((m) => m.nrc_joined);
  if (filter === "nrc_not") result = result.filter((m) => !m.nrc_joined);

  if (search) {
    result = result.filter(
      (m) =>
        m.name.toLowerCase().includes(search) ||
        m.phone_last4.includes(search) ||
        (m.nrc_name ?? "").toLowerCase().includes(search)
    );
  }

  return NextResponse.json({
    members: result,
    weeklyGoal: event.weekly_goal,
    total: members.length,
  });
}

export async function POST(req: NextRequest) {
  // 관리자가 직접 참여자를 등록하는 경우 (현장 등록 지원용)
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone_last4 === "string" ? body.phone_last4.trim() : "";
  const nrcJoined = Boolean(body?.nrc_joined);
  const nrcName = typeof body?.nrc_name === "string" ? body.nrc_name.trim() : "";

  if (!name || !/^\d{4}$/.test(phone)) {
    return NextResponse.json({ error: "이름과 전화번호 뒤 4자리를 확인하세요." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("members")
    .insert({
      name,
      phone_last4: phone,
      nrc_joined: nrcJoined,
      nrc_name: nrcJoined ? nrcName || null : null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
}
