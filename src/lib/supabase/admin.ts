import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * 서비스 롤 키를 사용하는 관리자용 Supabase 클라이언트.
 * RLS를 완전히 우회하므로 절대 브라우저로 전달하지 말고
 * API Route(서버) 안에서만 사용해야 합니다.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY를 확인하세요."
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
