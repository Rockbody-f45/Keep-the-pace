import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { getActiveEvent } from "@/lib/getEvent";
import { getAllMembers, getAllCheckins, groupCheckinsByMember, computeWeeklyStats } from "@/lib/adminData";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [event, members, checkins] = await Promise.all([
    getActiveEvent(),
    getAllMembers(),
    getAllCheckins(),
  ]);
  const checkinsByMember = groupCheckinsByMember(checkins);
  const weeks = computeWeeklyStats(event, members, checkinsByMember);

  return NextResponse.json({ weeks, event });
}
