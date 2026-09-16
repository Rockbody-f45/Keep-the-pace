import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const update: Record<string, unknown> = {};

  if (typeof body?.name === "string" && body.name.trim()) update.name = body.name.trim();
  if (typeof body?.phone_last4 === "string") {
    const phone = body.phone_last4.trim();
    if (!/^\d{4}$/.test(phone)) {
      return NextResponse.json({ error: "전화번호 뒤 4자리 형식이 올바르지 않습니다." }, { status: 400 });
    }
    update.phone_last4 = phone;
  }
  if (typeof body?.nrc_joined === "boolean") update.nrc_joined = body.nrc_joined;
  if (typeof body?.nrc_name === "string") update.nrc_name = body.nrc_name.trim() || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "수정할 내용이 없습니다." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("members")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const admin = createAdminClient();
  const { error } = await admin.from("members").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
