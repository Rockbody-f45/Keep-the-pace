import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { getCurrentCode, todayDateStringKST, nextCodeChangeLabelKST } from "@/lib/dailyCode";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  return NextResponse.json({
    code: getCurrentCode(),
    date: todayDateStringKST(),
    nextChangeAt: nextCodeChangeLabelKST(),
  });
}
