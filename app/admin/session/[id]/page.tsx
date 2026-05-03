"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { LiveSocket, type WSMessage } from "@/lib/ws";

type Session = {
  id: string;
  code: string;
  quizId: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
};

type Entry = {
  rank: number;
  userId: string;
  username: string;
  fullName: string;
  hospital: string;
  score: number;
  total: number;
  correct: number;
};

export default function AdminSessionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [board, setBoard] = useState<Entry[]>([]);
  const [presence, setPresence] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const u = auth.getUser();
    if (!u) { router.replace("/"); return; }
    if (u.role !== "instructor" && u.role !== "admin") {
      router.replace("/dashboard"); return;
    }
    const refresh = () => {
      api<Session>(`/api/sessions/${params.id}`).then(setSession).catch((e) => setErr(e.message));
      api<Entry[]>(`/api/sessions/${params.id}/leaderboard?limit=100`).then(setBoard).catch(() => {});
    };
    refresh();

    const sock = new LiveSocket();
    sock.connect();
    sock.join(`session:${params.id}`);
    const off = sock.on((msg: WSMessage) => {
      if (msg.type === "leaderboard:update" || msg.type === "submission:new") {
        api<Entry[]>(`/api/sessions/${params.id}/leaderboard?limit=100`).then(setBoard).catch(() => {});
      } else if (msg.type === "presence" && msg.payload) {
        setPresence(msg.payload.count || 0);
      } else if (msg.type === "session:end") {
        refresh();
      }
    });

    return () => {
      off();
      sock.close();
    };
  }, [params.id, router]);

  const start = async () => {
    setBusy(true); setErr("");
    try {
      const s = await api<Session>(`/api/sessions/${params.id}/start`, { method: "POST" });
      setSession(s);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };
  const end = async () => {
    setBusy(true); setErr("");
    try {
      const s = await api<Session>(`/api/sessions/${params.id}/end`, { method: "POST" });
      setSession(s);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/admin" className="text-sm text-brand-600 hover:underline">← กลับแผงควบคุม</Link>
        {!session ? (
          <div className="mt-4 text-slate-500">กำลังโหลด...</div>
        ) : (
          <>
            <div className="card mt-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-500">รหัสเซสชัน</div>
                  <div className="font-mono text-3xl font-bold tracking-wider">{session.code}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="ws-pulse inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">ผู้เข้าร่วมออนไลน์ {presence} คน</span>
                  </div>
                </div>
                <div>
                  <span
                    className={
                      "badge text-sm " +
                      (session.status === "running"
                        ? "bg-emerald-100 text-emerald-700"
                        : session.status === "ended"
                        ? "bg-slate-200 text-slate-700"
                        : "bg-amber-100 text-amber-700")
                    }
                  >
                    {session.status === "running" ? "● กำลังเปิด" : session.status === "ended" ? "● สิ้นสุดแล้ว" : "○ รอเริ่ม"}
                  </span>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {session.status === "pending" && (
                  <button className="btn-success" onClick={start} disabled={busy}>
                    🚀 เปิดข้อสอบให้ทุกคนพร้อมกัน
                  </button>
                )}
                {session.status === "running" && (
                  <button className="btn-danger" onClick={end} disabled={busy}>
                    หยุดเซสชัน
                  </button>
                )}
                <Link href={`/leaderboard/${session.id}`} className="btn-secondary">
                  เปิดกระดานคะแนนสด
                </Link>
                <Link href={`/quiz/${session.quizId}?session=${session.id}`} className="btn-secondary">
                  ดูข้อสอบ
                </Link>
              </div>
              {err && <div className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{err}</div>}
            </div>

            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold">กระดานคะแนน (เรียลไทม์)</h2>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">อันดับ</th>
                      <th className="px-4 py-3">ผู้เข้าอบรม</th>
                      <th className="px-4 py-3">โรงพยาบาล</th>
                      <th className="px-4 py-3 text-right">คะแนน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {board.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          ยังไม่มีผู้ส่งคำตอบ
                        </td>
                      </tr>
                    ) : (
                      board.map((e) => (
                        <tr key={e.userId} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold">
                            {e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : `#${e.rank}`}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{e.fullName}</div>
                            <div className="text-xs text-slate-500">@{e.username}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{e.hospital}</td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {e.score} <span className="text-slate-400">/ {e.total}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
