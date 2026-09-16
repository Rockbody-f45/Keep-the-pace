"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MemberWithStats } from "@/lib/types";
import { WEEKDAY_LABELS } from "@/lib/weeks";
import MemberDetailModal from "@/components/admin/MemberDetailModal";
import AddMemberModal from "@/components/admin/AddMemberModal";

type Filter = "all" | "success" | "fail" | "nrc" | "nrc_not";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "success", label: "이번 주 성공" },
  { value: "fail", label: "이번 주 미달성" },
  { value: "nrc", label: "NRC 참여" },
  { value: "nrc_not", label: "NRC 미참여" },
];

function MembersPageInner() {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get("filter") as Filter) || "all";

  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<MemberWithStats[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MemberWithStats | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (search.trim()) params.set("search", search.trim());
    const res = await fetch(`/api/admin/members?${params.toString()}`);
    const data = await res.json();
    setMembers(data.members ?? []);
    setWeeklyGoal(data.weeklyGoal ?? 3);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [filter, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">MEMBERS</p>
          <h1 className="text-3xl font-black mt-1">참여자 관리</h1>
          <p className="text-sm font-semibold text-[var(--color-ink-soft)] mt-1">
            전체 {total}명
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary h-11 px-5 text-sm">
          + 참여자 추가
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition ${
              filter === f.value
                ? "bg-[var(--color-ink)] text-white"
                : "bg-[var(--color-paper-raised)] border border-[var(--color-line)] text-[var(--color-ink-soft)]"
            }`}
          >
            {f.label}
          </button>
        ))}
        <input
          className="input-field ml-auto max-w-xs"
          placeholder="이름 / 전화번호 / NRC 이름 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="text-left text-xs font-bold text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
              <th className="py-3 pl-5 pr-3">이름</th>
              <th className="py-3 px-3">뒤4자리</th>
              <th className="py-3 px-3">NRC 이름</th>
              <th className="py-3 px-3">NRC</th>
              {WEEKDAY_LABELS.map((d) => (
                <th key={d} className="py-3 px-2 text-center">
                  {d}
                </th>
              ))}
              <th className="py-3 px-3 text-center">이번 주</th>
              <th className="py-3 px-3 text-center">성공</th>
              <th className="py-3 pr-5 pl-3"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr
                key={m.id}
                className="border-b border-[var(--color-line)]/60 hover:bg-[var(--color-paper)] cursor-pointer"
                onClick={() => setSelected(m)}
              >
                <td className="py-3 pl-5 pr-3 font-black">{m.name}</td>
                <td className="py-3 px-3 font-semibold text-[var(--color-ink-soft)]">
                  {m.phone_last4}
                </td>
                <td className="py-3 px-3 font-semibold">{m.nrc_name || "-"}</td>
                <td className="py-3 px-3">
                  {m.nrc_joined ? (
                    <span className="badge-success">참여</span>
                  ) : (
                    <span className="badge-fail">미참여</span>
                  )}
                </td>
                {m.weekDayFlags.map((done, i) => (
                  <td key={i} className="py-3 px-2 text-center font-black">
                    {done ? (
                      <span className="text-[var(--color-accent)]">O</span>
                    ) : (
                      <span className="text-[var(--color-stamp-empty)]">X</span>
                    )}
                  </td>
                ))}
                <td className="py-3 px-3 text-center font-black">
                  {m.weekCount} / {weeklyGoal}
                </td>
                <td className="py-3 px-3 text-center">
                  {m.weekSuccess ? (
                    <span className="badge-success">SUCCESS</span>
                  ) : (
                    <span className="badge-fail">-</span>
                  )}
                </td>
                <td className="py-3 pr-5 pl-3 text-right">
                  <span className="text-xs font-bold text-[var(--color-ink-soft)] underline underline-offset-4">
                    관리
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <p className="text-sm font-semibold text-[var(--color-ink-soft)] py-10 text-center">
            불러오는 중…
          </p>
        )}
        {!loading && members.length === 0 && (
          <p className="text-sm font-semibold text-[var(--color-ink-soft)] py-10 text-center">
            조건에 맞는 참여자가 없습니다.
          </p>
        )}
      </div>

      {selected && (
        <MemberDetailModal
          member={selected}
          onClose={() => setSelected(null)}
          onChanged={() => {
            load();
            setSelected(null);
          }}
        />
      )}
      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} onAdded={load} />}
    </div>
  );
}

export default function AdminMembersPage() {
  return (
    <Suspense fallback={null}>
      <MembersPageInner />
    </Suspense>
  );
}
