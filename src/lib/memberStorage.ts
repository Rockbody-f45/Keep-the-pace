"use client";

const KEY = "ktp_member";

export type SavedMember = {
  id: string;
  name: string;
};

export function getSavedMember(): SavedMember | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === "string" && typeof parsed.name === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveMember(member: SavedMember) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(member));
  } catch {
    // localStorage를 사용할 수 없는 환경(프라이빗 모드 등) → 무시, 매번 재확인하면 됨
  }
}

export function clearMember() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
