"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

// Modal สำหรับเลือก รพ. ก่อน create session
function HospitalPickerModal({
  quiz,
  hospitals,
  onConfirm,
  onClose,
}: {
  quiz: QuizListItem;
  hospitals: Hospital[];
  onConfirm: (quizId: string, hospitalId: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");

  const filtered = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.code.toLowerCase().includes(search.toLowerCase()) ||
      h.province.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="border-b p-5">
          <h2 className="text-lg font-bold">เลือกโรงพยาบาลสำหรับเซสชันนี้</h2>
          <p className="mt-1 text-sm text-slate-500">
            ข้อสอบ: <span className="font-medium text-slate-700">{quiz.title}</span>
          </p>
        </div>
        <div className="p-5">
          <input
            type="text"
            placeholder="ค้นหาชื่อ รพ. / รหัส / จังหวัด..."
            className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className="max-h-64 divide-y overflow-y-auto rounded-lg border border-slate-100">
            {filtered.length === 0 && (
              <li className="p-3 text-center text-sm text-slate-400">ไม่พบโรงพยาบาล</li>
            )}
            {filtered.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => setSelected(h.id)}
                  className={
                    "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-slate-50 " +
                    (selected === h.id ? "bg-brand-50 font-semibold text-brand-700" : "")
                  }
                >
                  <span className="flex-1">
                    {h.name}
                    <span className="ml-2 text-xs text-slate-400">({h.province})</span>
                  </span>
                  {selected === h.id && <span className="text-brand-600">✓</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end gap-2 border-t p-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => onConfirm(quiz.id, selected)}
            className="btn-primary disabled:opacity-50"
          >
            สร้างเซสชัน
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [creating, setCreating] = useState<string | null>(null);
  const [err, setErr] = useState("");
  // quiz ที่กำลังรอให้เลือก รพ.
  const [pendingQuiz, setPendingQuiz] = useState<QuizListItem | null>(null);

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
    setPendingQuiz(quiz);
  };

  const confirmCreate = async (quizId: string, hospitalId: string) => {
    setPendingQuiz(null);
    setCreating(quizId);
    setErr("");
    try {
      const s = await api<Session>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ quizId, hospitalId }),
      });
      router.push(`/admin/session/${s.id}`);
    } catch (e: any) {
      setErr(e.message || "สร้างเซสชันไม่สำเร็จ");
    } finally {
      setCreating(null);
    }
  };

  // หา ชื่อ รพ. จาก hospitalId
  const hospName = (id: string) =>
    hospitals.find((h) => h.id === id)?.name ?? id;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {pendingQuiz && (
        <HospitalPickerModal
          quiz={pendingQuiz}
          hospitals={hospitals}
          onConfirm={confirmCreate}
          onClose={() => setPendingQuiz(null)}
        />
      )}

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">แผงควบคุมวิทยากร</h1>
          <p className="text-slate-500">สร้างเซสชันสด เปิดข้อสอบให้ผู้เข้าอบรมพร้อมกัน และดูกระดานคะแนนแบบเรียลไทม์</p>
        </div>
        {err && <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{err}</div>}

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">เลือกข้อสอบเพื่อสร้างเซสชัน</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((q) => (
              <div key={q.id} className="card p-5">
                <span className="badge bg-brand-100 text-brand-700">{q.category}</span>
                <h3 className="mt-3 font-semibold">{q.title}</h3>
                <div className="mt-1 text-xs text-slate-500">
                  {q.cellCount} เซลล์ · {Math.floor(q.durationSec / 60)} นาที · ผ่าน {q.passPercent || 80}%
                </div>
                <button
                  className="btn-primary mt-4 w-full"
                  onClick={() => handleCreateClick(q)}
                  disabled={creating === q.id}
                >
                  {creating === q.id ? "กำลังสร้าง..." : "สร้างเซสชันสด"}
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
