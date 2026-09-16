"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/members", label: "참여자 관리" },
  { href: "/admin/settings", label: "이벤트 설정" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-[var(--color-line)] bg-[var(--color-paper-raised)] sticky top-0 z-10">
      <div className="container-admin px-5 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="font-black text-lg tracking-tight">
            KEEP THE <span className="text-[var(--color-accent)]">PACE</span>
            <span className="ml-2 text-xs font-bold text-[var(--color-ink-soft)]">ADMIN</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {LINKS.map((l) => {
              const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3.5 py-2 rounded-full text-sm font-bold transition ${
                    active
                      ? "bg-[var(--color-ink)] text-white"
                      : "text-[var(--color-ink-soft)] hover:bg-[var(--color-paper)]"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button
          onClick={logout}
          className="text-sm font-bold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          로그아웃
        </button>
      </div>
      <nav className="sm:hidden flex items-center gap-1 px-5 pb-3 overflow-x-auto scrollbar-thin">
        {LINKS.map((l) => {
          const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3.5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
                active ? "bg-[var(--color-ink)] text-white" : "bg-[var(--color-paper)] text-[var(--color-ink-soft)]"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
