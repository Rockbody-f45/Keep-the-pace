import crypto from "crypto";

/**
 * 오늘 날짜(KST, YYYY-MM-DD)를 반환합니다.
 * 서버가 어느 타임존에서 돌아가든 항상 한국 기준 날짜를 사용합니다.
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
 * 날짜 문자열 + 비밀키를 기반으로 4자리 출석 코드를 결정론적으로 생성합니다.
 * 스태프가 매일 코드를 만들 필요가 없고, 서버 재시작과도 무관하게
 * 같은 날짜에는 항상 같은 코드가 나옵니다.
 *
 * 부정 사용(집에서 URL 저장 후 체크인) 방지를 위한 1차 안전장치입니다.
 * 코드는 스튜디오 TV/데스크에만 표시하고, 관리자 화면(/admin)에서 확인할 수 있습니다.
 */
export function getDailyCode(dateStr: string): string {
  const secret = process.env.DAILY_CODE_SECRET;
  if (!secret) {
    throw new Error(
      "DAILY_CODE_SECRET 환경변수가 설정되지 않았습니다. .env.local을 확인하세요."
    );
  }
  const hash = crypto.createHmac("sha256", secret).update(dateStr).digest("hex");
  const num = parseInt(hash.slice(0, 8), 16) % 10000;
  return num.toString().padStart(4, "0");
}

export function getTodayCode(): string {
  return getDailyCode(todayDateStringKST());
}
