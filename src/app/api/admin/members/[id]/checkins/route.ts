import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

/** 한 회원의 전체 출석 기록 (id 포함) — 관리자가 잘못된 출석을 골라 삭제할 때 사용 */
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("checkins")
    .select("id, checkin_date, source, note, created_at")
    .eq("member_id", id)
    .order("checkin_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ checkins: data ?? [] });
}
