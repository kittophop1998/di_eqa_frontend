"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";

type Cell = { id: string; imageUrl: string };
type Category = { key: string; label: string; color: string };
type Quiz = {
  id: string;
  title: string;
  description: string;
  category: string;
  passPercent: number;
  durationSec: number;
  categories: Category[];
  cells: Cell[];
};

export default function QuizPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const sessionId = search.get("session") || "";

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  // assignments: cellId -> categoryKey
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [selectedCell, setSelectedCell] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmEarly, setConfirmEarly] = useState(false);
  const [err, setErr] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    if (!auth.isAuthed()) {
      router.replace("/");
      return;
    }
    api<Quiz>(`/api/quizzes/${params.id}`)
      .then((q) => {
        setQuiz(q);
        setSecondsLeft(q.durationSec);
        startedAt.current = Date.now();
      })
      .catch((e) => setErr(e.message));
  }, [params.id, router]);

  useEffect(() => {
    if (!quiz) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          submit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz]);

  const totalCells = quiz?.cells.length || 0;
  const assignedCount = Object.keys(assignments).length;
  const remaining = totalCells - assignedCount;

  // นับว่าผู้ใช้แปะแต่ละหมวดไปกี่ใบแล้ว
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    if (!quiz) return m;
    for (const cat of quiz.categories) m[cat.key] = 0;
    for (const k of Object.values(assignments)) m[k] = (m[k] || 0) + 1;
    return m;
  }, [assignments, quiz]);

  // เมื่อมีทั้ง cell และ category ถูกเลือก → แปะคำตอบทันที (วาร์ป)
  useEffect(() => {
    if (!selectedCell || !selectedCategory) return;
    setAssignments((a) => ({ ...a, [selectedCell]: selectedCategory }));
    setSelectedCell("");
    setSelectedCategory("");
  }, [selectedCell, selectedCategory]);

  const onCellTap = (cellId: string) => {
    if (assignments[cellId]) {
      // ถ้ากดเซลล์ที่จำแนกไปแล้ว = ดึงกลับมา
      setAssignments((a) => {
        const next = { ...a };
        delete next[cellId];
        return next;
      });
      setSelectedCell("");
      return;
    }
    setSelectedCell((curr) => (curr === cellId ? "" : cellId));
  };

  const onCategoryTap = (key: string) => {
    if (!selectedCell) {
      // ถ้ายังไม่ได้เลือกเซลล์ ให้ pre-select ชนิด — เซลล์ใบต่อไปที่จิ้มจะวาร์ปเข้าหมวดนี้ทันที
      setSelectedCategory((curr) => (curr === key ? "" : key));
      return;
    }
    setSelectedCategory(key);
  };

  const submit = async (force = false) => {
    if (!quiz || submitting) return;
    if (!force && remaining > 0 && !confirmEarly) {
      setConfirmEarly(true);
      return;
    }
    setSubmitting(true);
    setErr("");
    const dur = Math.round((Date.now() - startedAt.current) / 1000);
    try {
      const sub = await api<{ id: string }>(`/api/quizzes/${quiz.id}/submit`, {
        method: "POST",
        body: JSON.stringify({
          sessionId: sessionId || undefined,
          durationSec: dur,
          assignments,
        }),
      });
      router.replace(`/submissions/${sub.id}${sessionId ? `?session=${sessionId}` : ""}`);
    } catch (e: any) {
      setErr(e.message || "ส่งคำตอบไม่สำเร็จ");
      setSubmitting(false);
    }
  };

  const timeStr = useMemo(() => {
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [secondsLeft]);

  if (err && !quiz) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="card p-6 text-rose-700">{err}</div>
        </div>
      </div>
    );
  }
  if (!quiz) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-12 text-slate-500">กำลังโหลดข้อสอบ...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Sticky bar: เวลา + progress */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">{quiz.category}</div>
            <div className="font-semibold leading-tight">{quiz.title}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-500">
              จำแนกแล้ว <span className="font-semibold text-slate-900">{assignedCount}</span> / {totalCells}
            </div>
            <div
              className={
                "rounded-xl px-3 py-1.5 font-mono text-sm font-semibold " +
                (secondsLeft < 60 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700")
              }
            >
              ⏱ {timeStr}
            </div>
          </div>
        </div>
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-1 bg-brand-500 transition-all"
            style={{ width: `${totalCells > 0 ? (assignedCount / totalCells) * 100 : 0}%` }}
          />
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* แถบคำแนะนำ — เปลี่ยนสถานะตามว่ากำลังเลือกอะไร */}
        <div
          className={
            "mb-4 rounded-2xl border px-4 py-3 text-sm transition " +
            (selectedCell
              ? "border-brand-300 bg-brand-50 text-brand-800"
              : selectedCategory
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-slate-200 bg-white text-slate-600")
          }
        >
          {selectedCell ? (
            <span>
              ✦ เลือกเซลล์แล้ว — กดที่ <b>ชนิดเซลล์ฝั่งขวา</b> เพื่อวาร์ปเข้าตาราง
              <button
                onClick={() => setSelectedCell("")}
                className="ml-3 rounded-md bg-white px-2 py-0.5 text-xs underline"
              >
                ยกเลิก
              </button>
            </span>
          ) : selectedCategory ? (
            <span>
              ✦ ตั้งชนิดปลายทาง <b>{quiz.categories.find((c) => c.key === selectedCategory)?.label}</b> ไว้แล้ว — จิ้มเซลล์ที่ต้องการแปะได้เลย
              <button
                onClick={() => setSelectedCategory("")}
                className="ml-3 rounded-md bg-white px-2 py-0.5 text-xs underline"
              >
                ยกเลิก
              </button>
            </span>
          ) : (
            <span>
              วิธีทำ: <b>1)</b> จิ้มที่รูปเซลล์ฝั่งซ้าย <b>2)</b> จิ้มที่ชนิดเซลล์ฝั่งขวา → เซลล์จะวาร์ปทันที
              · จิ้มที่เซลล์ที่ "จำแนกไปแล้ว" เพื่อเอากลับมาแก้ไข
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          {/* ฝั่งซ้าย: ถาดเซลล์ */}
          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">เซลล์ที่ยังไม่ได้จำแนก</h2>
              <span className="badge bg-slate-100 text-slate-700">เหลือ {remaining} ใบ</span>
            </div>

            {remaining === 0 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-700">
                ✓ จำแนกครบทุกเซลล์แล้ว — กด <b>ส่งคำตอบ</b> ฝั่งขวาได้เลย
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-9">
                {quiz.cells
                  .filter((cell) => !assignments[cell.id])
                  .map((cell) => (
                    <button
                      key={cell.id}
                      onClick={() => onCellTap(cell.id)}
                      className={
                        "group relative aspect-square overflow-hidden rounded-xl border-2 bg-white transition " +
                        (selectedCell === cell.id
                          ? "border-brand-500 ring-4 ring-brand-200 scale-105 shadow-lg"
                          : "border-slate-200 hover:border-brand-300 hover:shadow")
                      }
                      aria-label={`เซลล์ ${cell.id}`}
                    >
                      <img
                        src={cell.imageUrl}
                        alt={cell.id}
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                      {selectedCell === cell.id && (
                        <span className="absolute inset-x-1 bottom-1 rounded-md bg-brand-600 px-1 text-[10px] font-semibold text-white">
                          เลือกอยู่ ✓
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            )}

            {/* แถวเซลล์ที่จำแนกไปแล้ว — กดเพื่อแก้ไขได้ */}
            {assignedCount > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                  <span>จำแนกไปแล้ว ({assignedCount}) — กดเพื่อนำกลับมาแก้</span>
                  {assignedCount > 0 && (
                    <button
                      onClick={() => setAssignments({})}
                      className="text-rose-600 underline"
                    >
                      ล้างทั้งหมด
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14">
                  {quiz.cells.map((cell) => {
                    const assigned = assignments[cell.id];
                    if (!assigned) return null;
                    const cat = quiz.categories.find((c) => c.key === assigned);
                    return (
                      <button
                        key={cell.id}
                        onClick={() => onCellTap(cell.id)}
                        className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 opacity-70 transition hover:opacity-100"
                        title={`${cell.id} → ${cat?.label}`}
                      >
                        <img src={cell.imageUrl} alt={cell.id} className="h-full w-full object-cover" />
                        <span
                          className="absolute inset-x-0 bottom-0 truncate px-0.5 py-px text-center text-[8px] font-bold text-white"
                          style={{ backgroundColor: cat?.color || "#475569" }}
                        >
                          {cat?.label?.slice(0, 3)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* ฝั่งขวา: ตารางหมวดหมู่ + counter + ปุ่ม Send */}
          <aside className="space-y-3">
            <div className="card p-4">
              <h2 className="mb-3 font-semibold">ชนิดของเซลล์ (จิ้มเพื่อแปะ)</h2>
              <div className="space-y-2">
                {quiz.categories.map((cat) => {
                  const isSelected = selectedCategory === cat.key;
                  const isPrimed = !!selectedCell;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => onCategoryTap(cat.key)}
                      className={
                        "flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition " +
                        (isSelected
                          ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200"
                          : isPrimed
                          ? "border-brand-200 bg-white hover:border-brand-500 hover:bg-brand-50"
                          : "border-slate-200 bg-white hover:border-slate-300")
                      }
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className="inline-block h-4 w-4 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-semibold">{cat.label}</span>
                      </span>
                      <span
                        className="rounded-lg px-2.5 py-1 font-mono text-sm font-bold text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        {counts[cat.key] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">รวมที่จำแนกแล้ว</span>
                  <span className="font-mono font-semibold">
                    {assignedCount} / {totalCells}
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-4">
              {confirmEarly && remaining > 0 && (
                <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  ยังเหลืออีก {remaining} เซลล์ที่ไม่ได้จำแนก จะถูกนับเป็นไม่ถูก — กด "ส่งคำตอบ" อีกครั้งเพื่อยืนยัน
                </div>
              )}
              <button
                className="btn-success w-full text-base"
                onClick={() => submit()}
                disabled={submitting}
              >
                {submitting ? "กำลังส่ง..." : "ส่งคำตอบ →"}
              </button>
              {err && (
                <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>
              )}
              <p className="mt-3 text-xs text-slate-500">
                ผ่านเกณฑ์ที่ {quiz.passPercent}% — ถ้าผ่านจะได้รับใบประกาศนียบัตรหลังส่งคำตอบ
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
