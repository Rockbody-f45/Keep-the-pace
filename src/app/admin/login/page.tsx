"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("로그인에 실패했습니다. 이메일/비밀번호를 확인해주세요.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-ink)] px-5">
      <form onSubmit={submit} className="card w-full max-w-sm p-8 space-y-4">
        <div className="mb-2">
          <p className="eyebrow">ADMIN</p>
          <h1 className="text-2xl font-black mt-1">KEEP THE PACE</h1>
          <p className="text-sm text-[var(--color-ink-soft)] font-semibold mt-1">
            관리자 로그인
          </p>
        </div>
        <input
          className="input-field"
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        <input
          className="input-field"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm font-bold text-[var(--color-accent-dark)]">{error}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary w-full h-12">
          {loading ? "로그인 중…" : "로그인"}
        </button>
        <p className="text-xs text-[var(--color-ink-soft)] font-semibold text-center pt-2">
          관리자 계정은 Supabase 대시보드에서 생성합니다.
        </p>
      </form>
    </main>
  );
}
