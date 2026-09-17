import crypto from "crypto";

/**
 * 오늘 날짜(KST, YYYY-MM-DD)를 반환합니다.
 * 서버가 어느 타임존에서 돌아가든 항상 한국 기준 날짜를 사용합니다.
 * (출석 기록의 checkin_date 등 "날짜" 단위 로직에 사용 — 출석 코드와는 무관)
 */
export function todayDateStringKST(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

/**
 * 현재 시(hour) 슬롯을 "YYYY-MM-DD-HH" (KST, 24시간제) 형태로 반환합니다.
 * 출석 코드는 이 슬롯 단위로 바뀝니다 (매 정시 자동 변경 → 오전반/오후반 코드가 달라짐).
 */
export function currentHourSlotKST(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}-${get("hour")}`;
}

/** 다음 코드 변경 시각(HH:00, KST)을 "HH:00" 형태로 반환 — 화면 안내용 */
export function nextCodeChangeLabelKST(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const nextHour = (hour + 1) % 24;
  return `${String(nextHour).padStart(2, "0")}:00`;
}

/**
 * 시간 슬롯 문자열 + 비밀키를 기반으로 4자리 출석 코드를 결정론적으로 생성합니다.
 * 스태프가 직접 코드를 만들거나 시간마다 바꿀 필요가 없고, 서버 재시작과도 무관하게
 * 같은 슬롯(같은 날짜+같은 시간)에는 항상 같은 코드가 나옵니다.
 *
 * 부정 사용(집에서 URL 저장 후 체크인) 방지를 위한 1차 안전장치입니다.
 * 코드는 스튜디오 TV/데스크에만 표시하고, 관리자 화면(/admin, /admin/today-code)에서 확인할 수 있습니다.
 */
export function getCodeForSlot(slot: string): string {
  const secret = process.env.DAILY_CODE_SECRET;
  if (!secret) {
    throw new Error(
      "DAILY_CODE_SECRET 환경변수가 설정되지 않았습니다. .env.local을 확인하세요."
    );
  }
  const hash = crypto.createHmac("sha256", secret).update(slot).digest("hex");
  const num = parseInt(hash.slice(0, 8), 16) % 10000;
  return num.toString().padStart(4, "0");
}

/** 지금 이 시각(KST) 기준의 출석 코드 — 매 정시마다 자동으로 바뀝니다 */
export function getCurrentCode(): string {
  return getCodeForSlot(currentHourSlotKST());
}
