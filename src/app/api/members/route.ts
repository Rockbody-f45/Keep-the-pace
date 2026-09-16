import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone_last4 === "string" ? body.phone_last4.trim() : "";
  const nrcJoined = Boolean(body?.nrc_joined);
  const nrcName = typeof body?.nrc_name === "string" ? body.nrc_name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }
  if (!/^\d{4}$/.test(phone)) {
    return NextResponse.json(
      { error: "휴대폰 번호 뒤 4자리(숫자 4자리)를 입력해주세요." },
      { status: 400 }
    );
  }
  if (nrcJoined && !nrcName) {
    return NextResponse.json(
      { error: "NRC 챌린지에 참여하신다면 NRC 이름(닉네임)을 입력해주세요." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("members")
    .insert({
      name,
      phone_last4: phone,
      nrc_joined: nrcJoined,
      nrc_name: nrcJoined ? nrcName : null,
    })
    .select("id, name, phone_last4, nrc_joined, nrc_name")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ member: data });
}
