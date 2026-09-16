"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSavedMember, saveMember, clearMember, SavedMember } from "@/lib/memberStorage";

type Stage = "loading" | "welcome_back" | "identify" | "register" | "picker";

type IdentifyMatch = {
  id: string;
  name: string;
  nrc_joined: boolean;
  nrc_name: string | null;
};

export default function HomePage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("loading");
  const [saved, setSaved] = useState<SavedMember | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nrcJoined, setNrcJoined] = useState<boolean | null>(null);
  const [nrcName, setNrcName] = useState("");
  const [matches, setMatches] = useState<IdentifyMatch[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const m = getSavedMember();
    if (m) {
      setSaved(m);
      setStage("welcome_back");
    } else {
      setStage("identify");
    }
  }, []);

  function goToCheckin(member: SavedMember) {
    saveMember(member);
    router.push("/checkin");
  }

  async function submitIdentify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !/^\d{4}$/.test(phone.trim())) {
      setError("이름과 휴대폰 번호 뒤 4자리를 정확히 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone_last4: phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "오류가 발생했습니다.");
        return;
      }
      if (!data.found) {
        setStage("register");
        return;
      }
      if (data.members.length === 1) {
        goToCheckin({ id: data.members[0].id, name: data.members[0].name });
        return;
      }
      setMatches(data.members);
      setStage("picker");
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !/^\d{4}$/.test(phone.trim())) {
      setError("이름과 휴대폰 번호 뒤 4자리를 정확히 입력해주세요.");
      return;
    }
    if (nrcJoined === null) {
      setError("NRC 러닝 챌린지 참여 여부를 선택해주세요.");
      return;
    }
    if (nrcJoined && !nrcName.trim()) {
      setError("NRC에서 사용하시는 이름(닉네임)을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone_last4: phone,
          nrc_joined: nrcJoined,
          nrc_name: nrcName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "등록 중 오류가 발생했습니다.");
        return;
      }
      goToCheckin({ id: data.member.id, name: data.member.name });
    } finally {
      setLoading(false);
    }
  }

  function switchPerson() {
    clearMember();
    setSaved(null);
    setName("");
    setPhone("");
    setError("");
    setStage("identify");
  }

  return (
    <main className="flex-1 flex flex-col">
      <div className="container-app w-full px-5 pt-10 pb-14 flex-1 flex flex-col">
        <Hero />

        <div className="mt-8">
          {stage === "loading" && (
            <div className="h-40 flex items-center justify-center text-[var(--color-ink-soft)] font-bold">
              불러오는 중…
            </div>
          )}

          {stage === "welcome_back" && saved && (
            <div className="card p-6 text-center">
              <p className="eyebrow mb-2">WELCOME BACK</p>
              <p className="text-2xl font-black mb-1">{saved.name}님, 안녕하세요!</p>
              <p className="text-sm text-[var(--color-ink-soft)] font-semibold mb-6">
                본인이 맞다면 아래 버튼을 눌러 출석을 진행하세요.
              </p>
              <button
                onClick={() => goToCheckin(saved)}
                className="btn btn-accent w-full h-14 text-lg"
              >
                오늘 출석하러 가기 →
              </button>
              <button
                onClick={switchPerson}
                className="mt-4 text-sm font-bold text-[var(--color-ink-soft)] underline underline-offset-4"
              >
                제가 아니에요 / 다른 사람이에요
              </button>
            </div>
          )}

          {stage === "identify" && (
            <form onSubmit={submitIdentify} className="card p-6 space-y-4">
              <p className="eyebrow mb-1">본인 확인</p>
              <p className="text-lg font-black leading-snug">
                이름과 휴대폰 번호 뒤 4자리를
                <br />
                입력해주세요
              </p>
              <div className="space-y-3">
                <input
                  className="input-field"
                  placeholder="이름"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                <input
                  className="input-field"
                  placeholder="휴대폰 번호 뒤 4자리"
                  inputMode="numeric"
                  maxLength={4}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </div>
              {error && <p className="text-sm font-bold text-[var(--color-accent-dark)]">{error}</p>}
              <button type="submit" disabled={loading} className="btn btn-accent w-full h-14 text-lg">
                {loading ? "확인 중…" : "확인하고 계속하기"}
              </button>
              <p className="text-xs text-center text-[var(--color-ink-soft)] font-semibold">
                처음이신가요? 위 정보를 입력하시면 자동으로 등록 화면으로 안내해드려요.
              </p>
            </form>
          )}

          {stage === "picker" && (
            <div className="card p-6 space-y-3">
              <p className="eyebrow mb-1">본인을 선택해주세요</p>
              <p className="text-sm text-[var(--color-ink-soft)] font-semibold mb-2">
                동일한 정보로 여러 명이 등록되어 있어요. NRC 이름을 확인하고 본인을 선택하세요.
              </p>
              {matches.map((m) => (
                <button
                  key={m.id}
                  onClick={() => goToCheckin({ id: m.id, name: m.name })}
                  className="w-full text-left border border-[var(--color-line)] rounded-2xl p-4 hover:border-[var(--color-ink)] transition"
                >
                  <p className="font-black">{m.name}</p>
                  <p className="text-xs text-[var(--color-ink-soft)] font-semibold mt-0.5">
                    NRC {m.nrc_joined ? `참여 · ${m.nrc_name ?? "-"}` : "미참여"}
                  </p>
                </button>
              ))}
              <button
                onClick={() => setStage("identify")}
                className="text-sm font-bold text-[var(--color-ink-soft)] underline underline-offset-4"
              >
                ← 다시 입력하기
              </button>
            </div>
          )}

          {stage === "register" && (
            <form onSubmit={submitRegister} className="card p-6 space-y-4">
              <p className="eyebrow mb-1">최초 등록</p>
              <p className="text-lg font-black leading-snug">
                처음 참여하시는군요!
                <br />
                간단한 정보만 등록할게요
              </p>

              <div className="space-y-3">
                <Field label="이름">
                  <input
                    className="input-field"
                    placeholder="이름"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                <Field label="휴대폰 번호 뒤 4자리">
                  <input
                    className="input-field"
                    placeholder="0000"
                    inputMode="numeric"
                    maxLength={4}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </Field>

                <Field label="NRC(Nike Run Club) 러닝 챌린지에 참여하시나요?">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNrcJoined(true)}
                      className={`btn h-12 ${nrcJoined === true ? "btn-primary" : "btn-outline"}`}
                    >
                      참여해요
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNrcJoined(false);
                        setNrcName("");
                      }}
                      className={`btn h-12 ${nrcJoined === false ? "btn-primary" : "btn-outline"}`}
                    >
                      미참여
                    </button>
                  </div>
                </Field>

                {nrcJoined && (
                  <Field label="NRC에서 사용하는 이름 또는 닉네임">
                    <input
                      className="input-field"
                      placeholder="NRC 닉네임"
                      value={nrcName}
                      onChange={(e) => setNrcName(e.target.value)}
                    />
                  </Field>
                )}
              </div>

              {error && <p className="text-sm font-bold text-[var(--color-accent-dark)]">{error}</p>}

              <button type="submit" disabled={loading} className="btn btn-accent w-full h-14 text-lg">
                {loading ? "등록 중…" : "등록하고 시작하기"}
              </button>
              <button
                type="button"
                onClick={() => setStage("identify")}
                className="text-sm font-bold text-[var(--color-ink-soft)] underline underline-offset-4"
              >
                ← 뒤로
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-xs font-semibold text-[var(--color-ink-soft)]">
          수집된 정보는 이벤트 운영 목적으로만 사용되며, 이벤트 종료 후 파기됩니다.
        </p>
      </div>
    </main>
  );
}

function Hero() {
  return (
    <header className="text-center">
      <p className="eyebrow">F45 연신내 · ATTENDANCE EVENT</p>
      <h1 className="mt-2 text-5xl font-black tracking-tight leading-[0.95]">
        KEEP THE
        <br />
        <span className="text-[var(--color-accent)]">PACE</span>
      </h1>
      <p className="mt-4 text-base font-extrabold leading-relaxed">
        TRAIN INSIDE. RUN OUTSIDE.
      </p>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)] font-semibold leading-relaxed">
        이번 주 F45 3회 이상 출석하고,
        <br />
        NRC 러닝 챌린지까지 완료해보세요.
      </p>
    </header>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
