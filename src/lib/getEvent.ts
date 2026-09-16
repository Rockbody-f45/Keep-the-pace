import "server-only";
import { createAdminClient } from "./supabase/admin";
import { EventSettings } from "./types";

/**
 * 현재 이벤트 설정을 가져옵니다. 여러 행이 있어도 가장 최근 생성된 1건만 사용합니다
 * (운영 단순화를 위해 이 프로젝트는 항상 "진행 중인 이벤트 1개"만 가정합니다).
 */
export async function getActiveEvent(): Promise<EventSettings> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      "이벤트 설정이 없습니다. Supabase에서 schema.sql을 실행했는지 확인하세요."
    );
  }
  return data as EventSettings;
}
