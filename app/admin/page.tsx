"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";

type QuizListItem = {
  id: string;
  title: string;
  category: string;
  cellCount: number;
  passPercent: number;
  durationSec: number;
};
type Session = {
  id: string;
  code: string;
  quizId: string;
  hospitalId: string;
  status: string;
  startedAt?: string;
  createdAt: string;
};
type Hospital = {
  id: string;
  code: string;
  name: string;
  province: string;
};

/* ────────────────────────────────────────────────────────────
   Modal: เลือก รพ. ก่อนสร้าง session
──────────────────────────────────────────────────────────── */
function HospitalPickerModal({
  hospitals,
  quizTitle,
  onConfirm,
  onCancel,
  loading,
}: {
  hospitals: Hospital[];
  quizTitle: string;
  onConfirm: (hospital: Hospital) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Hospital | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.code.toLowerCase().includes(search.toLowerCase()) ||
      (h.province ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-bold">เลือกโรงพยาบาล</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            สร้างเซสชัน <span className="font-medium text-slate-700">{quizTitle}</span> สำหรับ รพ.ใด?
          </p>
        </div>

        {/* Search */}
        <div className="px-6 pt-4">
          <input
            ref={inputRef}
            type="text"
            placeholder="ค้นหาชื่อ / รหัส รพ. / จังหวัด..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        <ul className="mx-6 mt-3 max-h-64 overflow-y-auto rounded-lg border">
          {filtered.length === 0 && (
            <li className="p-4 text-center text-sm text-slate-400">ไม่พบโรงพยาบาล</li>
          )}
          {filtered.map((h) => (
            <li key={h.id}>
              <button
                className={
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 " +
                  (selected?.id === h.id ? "bg-brand-50" : "")
                }
                onClick={() => setSelected(h)}
              >
                <span
                  className={
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 " +
                    (selected?.id === h.id
                      ? "border-brand-600 bg-brand-600"
                      : "border-slate-300")
                  }
                >
                  {selected?.id === h.id && (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{h.name}</span>
                  <span className="text-xs text-slate-400">
                    {h.code}
                    {h.province ? ` · ${h.province}` : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4">
          <button
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            onClick={onCancel}
            disabled={loading}
          >
            ยกเลิก
          </button>
          <button
            className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
            disabled={!selected || loading}
            onClick={() => selected && onConfirm(selected)}
          >
            {loading ? "กำลังสร้าง..." : "สร้างเซสชัน →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Admin Page
──────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [pendingQuiz, setPendingQuiz] = useState<QuizListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  const refresh = async () => {
    const [q, s, h] = await Promise.all([
      api<QuizListItem[]>("/api/quizzes"),
      api<Session[]>("/api/sessions/active"),
      api<Hospital[]>("/api/hospitals"),
    ]);
    setQuizzes(q || []);
    setSessions(s || []);
    setHospitals(h || []);
  };

  useEffect(() => {
    const u = auth.getUser();
    if (!u) {
      router.replace("/");
      return;
    }
    if (u.role !== "instructor" && u.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    refresh().catch((e) => setErr(e.message));
  }, [router]);

  const handleCreateClick = (quiz: QuizListItem) => {
    setErr("");
    setPendingQuiz(quiz);
  };

  const handleConfirmCreate = async (hospital: Hospital) => {
    if (!pendingQuiz) return;
    setCreating(true);
    setErr("");
    try {
      const s = await api<Session>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ quizId: pendingQuiz.id, hospitalCode: hospital.code }),
      });
      router.push(`/admin/session/${s.id}`);
    } catch (e: any) {
      setErr(e.message || "สร้างเซสชันไม่สำเร็จ");
    } finally {
      setCreating(false);
      setPendingQuiz(null);
    }
  };

  const hospName = (id: string) =>
    hospitals.find((h) => h.id === id)?.name ?? id;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {pendingQuiz && (
        <HospitalPickerModal
          hospitals={hospitals}
          quizTitle={pendingQuiz.title}
          loading={creating}
          onConfirm={handleConfirmCreate}
          onCancel={() => setPendingQuiz(null)}
        />
      )}

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">แผงควบคุมวิทยากร</h1>
          <p className="text-slate-500">
            สร้างเซสชันสด เปิดข้อสอบให้ผู้เข้าอบรมพร้อมกัน และดูกระดานคะแนนแบบเรียลไทม์
          </p>
        </div>
        {err && (
          <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{err}</div>
        )}

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">เลือกข้อสอบเพื่อสร้างเซสชัน</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((q) => (
              <div key={q.id} className="card p-5">
                <span className="badge bg-brand-100 text-brand-700">{q.category}</span>
                <h3 className="mt-3 font-semibold">{q.title}</h3>
                <div className="mt-1 text-xs text-slate-500">
                  {q.cellCount} เซลล์ · {Math.floor(q.durationSec / 60)} นาที · ผ่าน{" "}
                  {q.passPercent || 80}%
                </div>
                <button
                  className="btn-primary mt-4 w-full"
                  onClick={() => handleCreateClick(q)}
                >
                  🏥 เลือก รพ. และสร้างเซสชัน
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">เซสชันที่กำลังเปิดอยู่</h2>
          {sessions.length === 0 ? (
            <div className="card p-8 text-center text-slate-500">ยังไม่มีเซสชันที่เปิดอยู่</div>
          ) : (
            <div className="card divide-y">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <div className="text-sm text-slate-500">รหัสเซสชัน</div>
                    <div className="font-mono text-lg font-semibold">{s.code}</div>
                  </div>
                  {s.hospitalId && (
                    <div className="hidden text-sm text-slate-600 sm:block">
                      🏥 {hospName(s.hospitalId)}
                    </div>
                  )}
                  <div>
                    <span
                      className={
                        "badge " +
                        (s.status === "running"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700")
                      }
                    >
                      {s.status === "running" ? "● กำลังเปิด" : "○ รอเริ่ม"}
                    </span>
                  </div>
                  <Link href={`/admin/session/${s.id}`} className="btn-secondary">
                    จัดการ →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
