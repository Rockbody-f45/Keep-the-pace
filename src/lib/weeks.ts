import { WeekSummary } from "./types";
import { todayDateStringKST } from "./dailyCode";

const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토"] as const;

/** "YYYY-MM-DD" -> UTC-anchored Date (달력 날짜만 다루므로 UTC로 고정해 타임존 버그 방지) */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}

/** 주어진 날짜가 속한 주의 월요일을 반환 */
export function getMonday(d: Date): Date {
  const day = d.getUTCDay(); // 0=일 1=월 ... 6=토
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

/** 이벤트 시작일 기준 1주차 시작(월요일) */
export function eventFirstMonday(eventStartStr: string): Date {
  return getMonday(parseDate(eventStartStr));
}

/** 특정 날짜가 이벤트 시작일 기준 몇 주차인지 (1-based) */
export function weekIndexForDate(dateStr: string, eventStartStr: string): number {
  const base = eventFirstMonday(eventStartStr);
  const date = parseDate(dateStr);
  const diffDays = Math.round((date.getTime() - base.getTime()) / DAY_MS);
  return Math.floor(diffDays / 7) + 1;
}

export function weekRange(weekIndex: number, eventStartStr: string) {
  const base = eventFirstMonday(eventStartStr);
  const start = addDays(base, (weekIndex - 1) * 7);
  const end = addDays(start, 6);
  return { start, end };
}

/** 월~토 6일의 날짜 문자열 배열 */
export function weekDays(weekIndex: number, eventStartStr: string): string[] {
  const { start } = weekRange(weekIndex, eventStartStr);
  return [0, 1, 2, 3, 4, 5].map((i) => formatDate(addDays(start, i)));
}

export function formatWeekLabel(weekIndex: number, eventStartStr: string): string {
  const { start, end } = weekRange(weekIndex, eventStartStr);
  const fmt = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  return `${fmt(start)} ~ ${fmt(end)}`;
}

/** 이벤트 기간 내 전체 주차 번호 목록 (1..N) */
export function allWeekIndices(eventStartStr: string, eventEndStr: string): number[] {
  const lastWeek = weekIndexForDate(eventEndStr, eventStartStr);
  const n = Math.max(1, lastWeek);
  return Array.from({ length: n }, (_, i) => i + 1);
}

/** 오늘이 이벤트 기간 내 몇 주차인지. 기간 밖이면 가장 가까운 주차로 clamp */
export function currentWeekIndex(eventStartStr: string, eventEndStr: string): number {
  const today = todayDateStringKST();
  const idx = weekIndexForDate(today, eventStartStr);
  const maxIdx = weekIndexForDate(eventEndStr, eventStartStr);
  if (idx < 1) return 1;
  if (idx > maxIdx) return maxIdx;
  return idx;
}

/**
 * 특정 회원의 출석 날짜 목록을 받아 주차별 요약(WeekSummary[])을 만듭니다.
 * 최신 주차가 배열 앞쪽에 오도록 정렬합니다.
 */
/** 특정 회원의 "이번 주" 월~토 출석 플래그와 카운트만 빠르게 계산 (관리자 대시보드/테이블용) */
export function currentWeekAttendance(
  eventStartStr: string,
  eventEndStr: string,
  attendedDates: string[]
): { days: string[]; flags: boolean[]; count: number } {
  const idx = currentWeekIndex(eventStartStr, eventEndStr);
  const days = weekDays(idx, eventStartStr);
  const set = new Set(attendedDates);
  const flags = days.map((d) => set.has(d));
  return { days, flags, count: flags.filter(Boolean).length };
}

export function buildWeekSummaries(
  eventStartStr: string,
  eventEndStr: string,
  weeklyGoal: number,
  attendedDates: string[]
): WeekSummary[] {
  const attendedSet = new Set(attendedDates);
  const today = todayDateStringKST();
  const curIdx = currentWeekIndex(eventStartStr, eventEndStr);
  const indices = allWeekIndices(eventStartStr, eventEndStr);

  const summaries: WeekSummary[] = indices.map((weekIndex) => {
    const { start, end } = weekRange(weekIndex, eventStartStr);
    const days = weekDays(weekIndex, eventStartStr);
    const attended = days.filter((d) => attendedSet.has(d));
    const count = attended.length;
    return {
      weekIndex,
      weekStart: formatDate(start),
      weekEnd: formatDate(end),
      label: formatWeekLabel(weekIndex, eventStartStr),
      days,
      attendedDays: attended,
      count,
      success: count >= weeklyGoal,
      isCurrent: weekIndex === curIdx,
      isFuture: formatDate(start) > today,
    };
  });

  return summaries.reverse();
}
