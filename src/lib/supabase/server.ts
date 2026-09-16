import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * 서버 컴포넌트/라우트 핸들러에서 "현재 로그인한 관리자"의 세션을 읽기 위한
 * Supabase 클라이언트 (anon key + 쿠키 기반, RLS 적용됨/일반 권한).
 * 실제 테이블 읽기/쓰기는 여기서 하지 않고, 세션 검증(로그인 여부)에만 사용합니다.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요."
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // 서버 컴포넌트에서 호출된 경우 쿠키 쓰기가 무시될 수 있음(미들웨어에서 세션 갱신 처리).
        }
      },
    },
  });
}

/** 현재 요청에 로그인된 관리자가 있는지 확인 */
export async function getAdminSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
