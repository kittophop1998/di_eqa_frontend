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
  status: string;
  startedAt?: string;
  createdAt: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [creating, setCreating] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const refresh = async () => {
    const [q, s] = await Promise.all([
      api<QuizListItem[]>("/api/quizzes"),
      api<Session[]>("/api/sessions/active"),
    ]);
    setQuizzes(q || []);
    setSessions(s || []);
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

  const createSession = async (quizId: string) => {
    setCreating(quizId);
    setErr("");
    try {
      const s = await api<Session>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ quizId }),
      });
      router.push(`/admin/session/${s.id}`);
    } catch (e: any) {
      setErr(e.message || "สร้างเซสชันไม่สำเร็จ");
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
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
                  onClick={() => createSession(q.id)}
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
