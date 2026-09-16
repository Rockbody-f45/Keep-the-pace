import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone_last4 === "string" ? body.phone_last4.trim() : "";

  if (!name || !/^\d{4}$/.test(phone)) {
    return NextResponse.json(
      { error: "이름과 휴대폰 번호 뒤 4자리를 정확히 입력해주세요." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("members")
    .select("id, name, phone_last4, nrc_joined, nrc_name")
    .ilike("name", name)
    .eq("phone_last4", phone);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({ found: true, members: data });
}
