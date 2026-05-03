"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { LiveSocket, type WSMessage } from "@/lib/ws";

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

export default function LeaderboardPage() {
  const params = useParams<{ sessionId: string }>();
  const [board, setBoard] = useState<Entry[]>([]);
  const [presence, setPresence] = useState(0);
  const [flashId, setFlashId] = useState<string>("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!auth.isAuthed()) return;
    const refresh = () =>
      api<Entry[]>(`/api/sessions/${params.sessionId}/leaderboard?limit=50`)
        .then(setBoard)
        .catch(() => {});
    refresh();
    const interval = setInterval(refresh, 8000);

    const sock = new LiveSocket();
    sock.connect();
    setTimeout(() => setConnected(true), 600);
    sock.join(`session:${params.sessionId}`);
    const off = sock.on((msg: WSMessage) => {
      if (msg.type === "leaderboard:update" && msg.payload) {
        setFlashId(msg.payload.userId);
        setTimeout(() => setFlashId(""), 1800);
        refresh();
      } else if (msg.type === "presence" && msg.payload) {
        setPresence(msg.payload.count || 0);
      }
    });
    return () => {
      clearInterval(interval);
      off();
      sock.close();
    };
  }, [params.sessionId]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm uppercase tracking-widest text-brand-200">
              <span className={"inline-block h-2 w-2 rounded-full " + (connected ? "bg-emerald-400" : "bg-amber-400")} />
              {connected ? "Live" : "Connecting"}
            </div>
            <h1 className="mt-1 text-3xl font-bold">🏆 กระดานคะแนนสด</h1>
            <div className="text-sm text-brand-200">
              ผู้เข้าร่วมออนไลน์ {presence} คน · อัปเดตทันทีเมื่อมีคนส่งคำตอบ
            </div>
          </div>
          <Link href="/dashboard" className="btn-secondary !bg-white/10 !text-white !border-white/20 hover:!bg-white/20">
            กลับ
          </Link>
        </div>

        <div className="mt-8 space-y-2">
          {board.length === 0 ? (
            <div className="rounded-2xl bg-white/5 p-12 text-center text-brand-200">
              กำลังรอผู้เข้าร่วมส่งคำตอบ...
            </div>
          ) : (
            board.map((e, i) => {
              const pct = e.total > 0 ? Math.round((e.score / e.total) * 100) : 0;
              const isTop = i < 3;
              return (
                <div
                  key={e.userId}
                  className={
                    "flex items-center gap-4 rounded-2xl px-4 py-4 transition " +
                    (flashId === e.userId
                      ? "bg-emerald-500/30 ring-2 ring-emerald-300"
                      : isTop
                      ? "bg-white/10 ring-1 ring-white/20"
                      : "bg-white/5")
                  }
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-xl font-bold">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{e.fullName}</div>
                    <div className="text-xs text-brand-200">
                      @{e.username} · {e.hospital}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{e.score}</div>
                    <div className="text-xs text-brand-200">/ {e.total} ({pct}%)</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
