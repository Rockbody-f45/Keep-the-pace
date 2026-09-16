import "server-only";
import { createAdminClient } from "./supabase/admin";
import { getActiveEvent } from "./getEvent";
import {
  currentWeekAttendance,
  allWeekIndices,
  weekRange,
  weekDays,
  formatWeekLabel,
  formatDate,
} from "./weeks";
import { Member, Checkin, EventSettings, MemberWithStats } from "./types";

export async function getAllMembers(): Promise<Member[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("members")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Member[];
}

export async function getAllCheckins(): Promise<Checkin[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("checkins")
    .select("*")
    .order("checkin_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Checkin[];
}

export function groupCheckinsByMember(checkins: Checkin[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const c of checkins) {
    const arr = map.get(c.member_id) ?? [];
    arr.push(c.checkin_date);
    map.set(c.member_id, arr);
  }
  return map;
}

export async function getMembersWithCurrentWeek(): Promise<{
  event: EventSettings;
  members: MemberWithStats[];
  checkinsByMember: Map<string, string[]>;
}> {
  const [event, members, checkins] = await Promise.all([
    getActiveEvent(),
    getAllMembers(),
    getAllCheckins(),
  ]);
  const checkinsByMember = groupCheckinsByMember(checkins);

  const withStats: MemberWithStats[] = members.map((m) => {
    const dates = checkinsByMember.get(m.id) ?? [];
    const { flags, count } = currentWeekAttendance(event.start_date, event.end_date, dates);
    return {
      ...m,
      weekDayFlags: flags,
      weekCount: count,
      weekSuccess: count >= event.weekly_goal,
    };
  });

  return { event, members: withStats, checkinsByMember };
}

export type WeeklyStatRow = {
  weekIndex: number;
  label: string;
  weekStart: string;
  weekEnd: string;
  participants: number;
  achieved: number;
  rate: number;
};

export function computeWeeklyStats(
  event: EventSettings,
  members: Member[],
  checkinsByMember: Map<string, string[]>
): WeeklyStatRow[] {
  const indices = allWeekIndices(event.start_date, event.end_date);

  return indices.map((weekIndex) => {
    const { end } = weekRange(weekIndex, event.start_date);
    const weekEndStr = formatDate(end);
    const days = new Set(weekDays(weekIndex, event.start_date));

    const registeredByThen = members.filter((m) => m.created_at.slice(0, 10) <= weekEndStr);
    let achieved = 0;
    for (const m of registeredByThen) {
      const dates = checkinsByMember.get(m.id) ?? [];
      const count = dates.filter((d) => days.has(d)).length;
      if (count >= event.weekly_goal) achieved++;
    }

    const participants = registeredByThen.length;
    const rate = participants > 0 ? Math.round((achieved / participants) * 1000) / 10 : 0;

    return {
      weekIndex,
      label: formatWeekLabel(weekIndex, event.start_date),
      weekStart: formatDate(weekRange(weekIndex, event.start_date).start),
      weekEnd: weekEndStr,
      participants,
      achieved,
      rate,
    };
  });
}
