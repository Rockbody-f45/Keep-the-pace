"use client";

import { useState } from "react";

export default function AddMemberModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nrcJoined, setNrcJoined] = useState(false);
  const [nrcName, setNrcName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone_last4: phone, nrc_joined: nrcJoined, nrc_name: nrcName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "등록 중 오류가 발생했습니다.");
        return;
      }
      onAdded();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6" onClick={onClose}>
      <div
        className="bg-[var(--color-paper-raised)] w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black">참여자 추가</h2>
          <button onClick={onClose} className="text-sm font-bold text-[var(--color-ink-soft)]">
            닫기
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            className="input-field"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input-field"
            placeholder="전화번호 뒤 4자리"
            inputMode="numeric"
            maxLength={4}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setNrcJoined(true)}
              className={`btn h-10 text-sm ${nrcJoined ? "btn-primary" : "btn-outline"}`}
            >
              NRC 참여
            </button>
            <button
              type="button"
              onClick={() => {
                setNrcJoined(false);
                setNrcName("");
              }}
              className={`btn h-10 text-sm ${!nrcJoined ? "btn-primary" : "btn-outline"}`}
            >
              NRC 미참여
            </button>
          </div>
          {nrcJoined && (
            <input
              className="input-field"
              placeholder="NRC 이름/닉네임"
              value={nrcName}
              onChange={(e) => setNrcName(e.target.value)}
            />
          )}
          {error && <p className="text-sm font-bold text-[var(--color-accent-dark)]">{error}</p>}
          <button type="submit" disabled={saving} className="btn btn-accent w-full h-12">
            {saving ? "등록 중…" : "등록"}
          </button>
        </form>
      </div>
    </div>
  );
}
