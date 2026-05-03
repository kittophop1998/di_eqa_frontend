"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { LiveSocket, type WSMessage } from "@/lib/ws";

type QuizListItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  cellCount: number;
  passPercent: number;
  durationSec: number;
};

type SubmissionItem = {
  id: string;
  quizId: string;
  score: number;
  total: number;
  correct: number;
  percent: number;
  passed: boolean;
  certificateId?: string;
  submittedAt: string;
};

type ActiveSession = {
  id: string;
  code: string;
  quizId: string;
  status: string;
  startedAt?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [history, setHistory] = useState<SubmissionItem[]>([]);
  const [active, setActive] = useState<ActiveSession[]>([]);
  const [liveBanner, setLiveBanner] = useState<{ sessionId: string; quizId: string } | null>(null);

  useEffect(() => {
    if (!auth.isAuthed()) {
      router.replace("/");
      return;
    }
    Promise.all([
      api<QuizListItem[]>("/api/quizzes"),
      api<SubmissionItem[]>("/api/submissions/me"),
      api<ActiveSession[]>("/api/sessions/active"),
    ])
      .then(([q, h, a]) => {
        setQuizzes(q || []);
        setHistory(h || []);
        setActive(a || []);
      })
      .catch(() => {
        auth.logout();
        router.replace("/");
      });

    const sock = new LiveSocket();
    sock.connect();
    // join hospital room เพื่อรับเฉพาะ session ของ รพ. ตัวเอง
    const u = auth.getUser();
    const hospitalRoom = u?.hospitalId ? `hospital:${u.hospitalId}` : "global";
    sock.join(hospitalRoom);
    const off = sock.on((msg: WSMessage) => {
      if (msg.type === "session:start" && msg.payload) {
        setLiveBanner({ sessionId: msg.payload.sessionId, quizId: msg.payload.quizId });
        api<ActiveSession[]>("/api/sessions/active").then((a) => setActive(a || []));
      }
    });
    return () => {
      off();
      sock.close();
    };
  }, [router]);

  const user = auth.getUser();
  // quiz ที่มี active session อยู่แล้ว → แสดงใน section เซสชันสด ไม่ต้องซ้ำล่าง
  const activeQuizIds = new Set(active.map((s) => s.quizId));
  const standaloneQuizzes = quizzes.filter((q) => !activeQuizIds.has(q.id));

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {liveBanner && (
        <div className="bg-emerald-600 text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>
              <div>
                <div className="font-semibold">วิทยากรเปิดข้อสอบสด!</div>
                <div className="text-sm opacity-90">เข้าร่วมเซสชันเพื่อทำข้อสอบและขึ้นกระดานคะแนน</div>
              </div>
            </div>
            <Link
              href={`/quiz/${liveBanner.quizId}?session=${liveBanner.sessionId}`}
              className="btn !bg-white !text-emerald-700 !py-2"
            >
              เข้าร่วมตอนนี้ →
            </Link>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold">สวัสดี, {user?.fullName} 👋</h1>
            <p className="text-slate-500">เลือกข้อสอบที่ต้องการทำหรือดูประวัติคะแนนของคุณ</p>
          </div>
        </div>

        {active.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">เซสชันสด</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((s) => (
                <Link
                  key={s.id}
                  href={`/quiz/${s.quizId}?session=${s.id}`}
                  className="card p-4 transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="badge bg-emerald-100 text-emerald-700">
                      {s.status === "running" ? "● กำลังดำเนินการ" : "○ รอเริ่ม"}
                    </span>
                    <code className="text-xs text-slate-500">{s.code}</code>
                  </div>
                  <div className="mt-2 font-semibold">เซสชันสำหรับการอบรม</div>
                  <div className="text-sm text-slate-500">เริ่มทำข้อสอบและขึ้นกระดานคะแนน</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">ข้อสอบทั้งหมด</h2>
          {standaloneQuizzes.length === 0 ? (
            <div className="card p-8 text-center text-slate-500">ยังไม่มีข้อสอบในระบบ</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {standaloneQuizzes.map((q) => (
                <div key={q.id} className="card flex flex-col p-5">
                  <div className="flex items-center justify-between">
                    <span className="badge bg-brand-100 text-brand-700">{q.category}</span>
                    <span className="text-xs text-slate-500">{q.cellCount} เซลล์</span>
                  </div>
                  <h3 className="mt-3 font-semibold leading-snug">{q.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{q.description}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                    <span>⏱ {Math.floor(q.durationSec / 60)} นาที</span>
                    <span>·</span>
                    <span>เกณฑ์ผ่าน {q.passPercent || 80}%</span>
                  </div>
                  <Link href={`/quiz/${q.id}`} className="btn-primary mt-4">
                    เริ่มทำข้อสอบ
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">ประวัติคะแนน</h2>
          {history.length === 0 ? (
            <div className="card p-8 text-center text-slate-500">ยังไม่มีประวัติการทำข้อสอบ</div>
          ) : (
            <div className="card divide-y">
              {history.map((s) => {
                const pct = s.percent ?? (s.total > 0 ? Math.round((s.score / s.total) * 100) : 0);
                return (
                  <Link
                    key={s.id}
                    href={`/submissions/${s.id}`}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50"
                  >
                    <div>
                      <div className="font-medium">
                        จำแนกถูก {s.correct} / {s.total} เซลล์
                        {s.passed && (
                          <span className="ml-2 inline-block rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-semibold text-yellow-900">
                            🎖 ได้ใบประกาศ
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(s.submittedAt).toLocaleString("th-TH")}
                      </div>
                    </div>
                    <div
                      className={
                        "rounded-xl px-3 py-1.5 text-sm font-semibold " +
                        (pct >= 80
                          ? "bg-emerald-100 text-emerald-700"
                          : pct >= 60
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700")
                      }
                    >
                      {pct}%
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
