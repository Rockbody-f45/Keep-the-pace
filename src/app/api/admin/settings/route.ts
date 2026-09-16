import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveEvent } from "@/lib/getEvent";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const event = await getActiveEvent();
  return NextResponse.json({ event });
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const update: Record<string, unknown> = {};

  if (typeof body?.name === "string" && body.name.trim()) update.name = body.name.trim();
  if (typeof body?.start_date === "string" && body.start_date) update.start_date = body.start_date;
  if (typeof body?.end_date === "string" && body.end_date) update.end_date = body.end_date;
  if (typeof body?.weekly_goal === "number" && body.weekly_goal >= 1 && body.weekly_goal <= 6) {
    update.weekly_goal = Math.round(body.weekly_goal);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "수정할 내용이 없습니다." }, { status: 400 });
  }

  const startDate = (update.start_date as string) ?? undefined;
  const endDate = (update.end_date as string) ?? undefined;
  if (startDate && endDate && endDate < startDate) {
    return NextResponse.json({ error: "종료일은 시작일 이후여야 합니다." }, { status: 400 });
  }

  const event = await getActiveEvent();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("events")
    .update(update)
    .eq("id", event.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}
