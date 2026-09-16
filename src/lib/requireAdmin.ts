import "server-only";
import { getAdminSession } from "./supabase/server";

/** API Route에서 관리자 로그인 여부를 확인. 로그인 안 됐으면 null 반환 */
export async function requireAdmin() {
  const user = await getAdminSession();
  return user ?? null;
}
