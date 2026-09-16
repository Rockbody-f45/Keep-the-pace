import { NextResponse } from "next/server";
import { getActiveEvent } from "@/lib/getEvent";

export async function GET() {
  try {
    const event = await getActiveEvent();
    return NextResponse.json({
      name: event.name,
      start_date: event.start_date,
      end_date: event.end_date,
      weekly_goal: event.weekly_goal,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
