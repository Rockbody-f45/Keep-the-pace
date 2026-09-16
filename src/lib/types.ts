export type Member = {
  id: string;
  name: string;
  phone_last4: string;
  nrc_joined: boolean;
  nrc_name: string | null;
  created_at: string;
  updated_at: string;
};

export type CheckinSource = "member" | "admin";

export type Checkin = {
  id: string;
  member_id: string;
  checkin_date: string; // YYYY-MM-DD
  source: CheckinSource;
  note: string | null;
  created_at: string;
};

export type EventSettings = {
  id: string;
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  weekly_goal: number;
  created_at: string;
  updated_at: string;
};

export type WeekSummary = {
  weekIndex: number;
  weekStart: string;
  weekEnd: string;
  label: string; // e.g. "9/28 ~ 10/4"
  days: string[]; // Mon..Sat (6 dates)
  attendedDays: string[]; // subset of days the member checked in
  count: number;
  success: boolean;
  isCurrent: boolean;
  isFuture: boolean;
};

export type MemberWithStats = Member & {
  weekDayFlags: boolean[]; // Mon..Sat for current week
  weekCount: number;
  weekSuccess: boolean;
};
