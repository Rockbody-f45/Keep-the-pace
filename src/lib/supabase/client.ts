"use client";

import { createBrowserClient } from "@supabase/ssr";

/** 관리자 로그인 폼 등 브라우저에서 Supabase Auth만 사용할 때의 클라이언트 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
