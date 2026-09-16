/** 브라우저에서 오늘 날짜(KST, YYYY-MM-DD)를 얻기 위한 클라이언트용 헬퍼 (표시 전용) */
export function todayLocalDateString(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}
