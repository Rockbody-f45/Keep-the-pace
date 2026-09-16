"use client";

import { useEffect, useState } from "react";
import { MemberWithStats } from "@/lib/types";
import { WEEKDAY_LABELS } from "@/lib/weeks";

type CheckinRow = {
  id: string;
  checkin_date: string;
  source: "member" | "admin";
  note: string | null;
};

export default function MemberDetailModal({
  member,
  onClose,
  onChanged,
}: {
  member: MemberWithStats;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState(member.name);
  const [phone, setPhone] = useState(member.phone_last4);
  const [nrcJoined, setNrcJoined] = useState(member.nrc_joined);
  const [nrcName, setNrcName] = useState(member.nrc_name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [loadingCheckins, setLoadingCheckins] = useState(true);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [addingCheckin, setAddingCheckin] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadCheckins() {
    setLoadingCheckins(true);
    const res = await fetch(`/api/admin/members/${member.id}/checkins`);
    const data = await res.json();
    setCheckins(data.checkins ?? []);
    setLoadingCheckins(false);
  }

  useEffect(() => {
    loadCheckins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id]);

  async function saveMember(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone_last4: phone,
          nrc_joined: nrcJoined,
          nrc_name: nrcJoined ? nrcName : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장 중 오류가 발생했습니다.");
        return;
      }
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  async function addCheckin() {
    setAddingCheckin(true);
    setError("");
    try {
      const res = await fetch("/api/admin/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: member.id, checkin_date: newDate, note: "관리자 수동 추가" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "출석 추가 중 오류가 발생했습니다.");
        return;
      }
      await loadCheckins();
      onChanged();
    } finally {
      setAddingCheckin(false);
    }
  }

  async function deleteCheckin(id: string) {
    if (!confirm("이 출석 기록을 삭제할까요?")) return;
    await fetch(`/api/admin/checkins/${id}`, { method: "DELETE" });
    await loadCheckins();
    onChanged();
  }

  async function deleteMember() {
    if (!confirm(`${member.name}님을 참여자 명단에서 완전히 삭제할까요? 되돌릴 수 없습니다.`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/members/${member.id}`, { method: "DELETE" });
      onChanged();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6" onClick={onClose}>
      <div
        className="bg-[var(--color-paper-raised)] w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black">참여자 상세</h2>
          <button onClick={onClose} className="text-sm font-bold text-[var(--color-ink-soft)]">
            닫기
          </button>
        </div>

        <form onSubmit={saveMember} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1">이름</span>
              <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block">
              <span className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1">
                전화번호 뒤4자리
              </span>
              <input
                className="input-field"
                inputMode="numeric"
                maxLength={4}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <label className="block">
              <span className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1">
                NRC 참여
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNrcJoined(true)}
                  className={`btn h-10 text-sm ${nrcJoined ? "btn-primary" : "btn-outline"}`}
                >
                  참여
                </button>
                <button
                  type="button"
                  onClick={() => setNrcJoined(false)}
                  className={`btn h-10 text-sm ${!nrcJoined ? "btn-primary" : "btn-outline"}`}
                >
                  미참여
                </button>
              </div>
            </label>
            <label className="block">
              <span className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1">
                NRC 이름
              </span>
              <input
                className="input-field"
                disabled={!nrcJoined}
                value={nrcName}
                onChange={(e) => setNrcName(e.target.value)}
              />
            </label>
          </div>

          {error && <p className="text-sm font-bold text-[var(--color-accent-dark)]">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn btn-primary h-11 px-5 text-sm">
              {saving ? "저장 중…" : "정보 저장"}
            </button>
            <button
              type="button"
              onClick={deleteMember}
              disabled={deleting}
              className="btn btn-outline h-11 px-5 text-sm text-[var(--color-accent-dark)] border-[var(--color-accent-soft)]"
            >
              {deleting ? "삭제 중…" : "참여자 삭제"}
            </button>
          </div>
        </form>

        <hr className="my-6 border-[var(--color-line)]" />

        <div>
          <p className="eyebrow mb-3">출석 기록 관리</p>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="date"
              className="input-field"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <button
              onClick={addCheckin}
              disabled={addingCheckin}
              className="btn btn-accent h-11 px-4 text-sm whitespace-nowrap"
            >
              수동 출석 추가
            </button>
          </div>

          {loadingCheckins ? (
            <p className="text-sm font-semibold text-[var(--color-ink-soft)] py-4 text-center">
              불러오는 중…
            </p>
          ) : checkins.length === 0 ? (
            <p className="text-sm font-semibold text-[var(--color-ink-soft)] py-4 text-center">
              출석 기록이 없습니다.
            </p>
          ) : (
            <ul className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin">
              {checkins.map((c) => {
                const d = new Date(c.checkin_date + "T00:00:00Z");
                const wd = WEEKDAY_LABELS[(d.getUTCDay() + 6) % 7] ?? "";
                return (
                  <li
                    key={c.id}
                    className="flex items-center justify-between border border-[var(--color-line)] rounded-xl px-3 py-2"
                  >
                    <span className="text-sm font-bold">
                      {c.checkin_date} ({wd})
                      <span className="ml-2 text-xs font-semibold text-[var(--color-ink-soft)]">
                        {c.source === "admin" ? "관리자 수동" : "본인 QR"}
                      </span>
                    </span>
                    <button
                      onClick={() => deleteCheckin(c.id)}
                      className="text-xs font-bold text-[var(--color-accent-dark)]"
                    >
                      삭제
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
