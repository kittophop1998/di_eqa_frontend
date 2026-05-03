"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";

type CellAnswer = {
  cellId: string;
  imageUrl: string;
  assignedType: string;
  correctType: string;
  isCorrect: boolean;
};

type CategoryStat = {
  key: string;
  label: string;
  color: string;
  userCount: number;
  trueCount: number;
  correct: number;
};

type Submission = {
  id: string;
  quizId: string;
  quizTitle: string;
  sessionId?: string;
  fullName: string;
  username: string;
  hospitalName: string;
  score: number;
  total: number;
  correct: number;
  percent: number;
  passPercent: number;
  passed: boolean;
  certificateId?: string;
  categories: CategoryStat[];
  answers: CellAnswer[];
  durationSec: number;
  submittedAt: string;
};

export default function SubmissionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const sessionFromUrl = search.get("session") || "";
  const [sub, setSub] = useState<Submission | null>(null);
  const [err, setErr] = useState("");
  const [showWrongOnly, setShowWrongOnly] = useState(true);
  const [showCert, setShowCert] = useState(false);

  useEffect(() => {
    if (!auth.isAuthed()) {
      router.replace("/");
      return;
    }
    api<Submission>(`/api/submissions/${params.id}`)
      .then(setSub)
      .catch((e) => setErr(e.message));
  }, [params.id, router]);

  const grade = useMemo(() => {
    if (!sub) return { label: "", className: "" };
    if (sub.passed) return { label: "ผ่าน", className: "text-emerald-700 bg-emerald-100" };
    if (sub.percent >= 60) return { label: "ใกล้ผ่าน", className: "text-amber-700 bg-amber-100" };
    return { label: "ควรทบทวน", className: "text-rose-700 bg-rose-100" };
  }, [sub]);

  const categoryByKey = useMemo(() => {
    const m = new Map<string, CategoryStat>();
    sub?.categories?.forEach((c) => m.set(c.key, c));
    return m;
  }, [sub]);

  if (err) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="card p-6 text-rose-700">{err}</div>
        </div>
      </div>
    );
  }
  if (!sub) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-12 text-slate-500">กำลังโหลดผล...</div>
      </div>
    );
  }

  const sessionId = sub.sessionId || sessionFromUrl;
  const filteredAnswers = showWrongOnly
    ? sub.answers.filter((a) => !a.isCorrect)
    : sub.answers;

  return (
    <>
      <div className="min-h-screen bg-slate-50 print:hidden">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8">
          {/* ส่วนคะแนนหลัก */}
          <div className="card overflow-hidden">
            <div
              className={
                "p-6 text-white " +
                (sub.passed
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500"
                  : "bg-gradient-to-r from-brand-600 to-brand-500")
              }
            >
              <div className="text-sm opacity-90">ผลคะแนนของคุณ</div>
              <div className="mt-1 flex items-end gap-3">
                <div className="text-5xl font-bold">{sub.percent}%</div>
                <div className="pb-1 text-xl opacity-90">
                  ({sub.correct} / {sub.total} เซลล์ถูก)
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={"badge text-sm " + grade.className}>
                  {grade.label}
                </span>
                <span className="badge bg-white/20 text-white text-sm">
                  เกณฑ์ผ่าน {sub.passPercent}%
                </span>
                <span className="badge bg-white/20 text-white text-sm">
                  ใช้เวลา {Math.floor(sub.durationSec / 60)}:
                  {(sub.durationSec % 60).toString().padStart(2, "0")} นาที
                </span>
                {sub.passed && sub.certificateId && (
                  <span className="badge bg-yellow-300 text-yellow-900 text-sm font-semibold">
                    🎖 ใบประกาศ #{sub.certificateId}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 text-sm">
              <div className="text-slate-500">
                ส่งเมื่อ {new Date(sub.submittedAt).toLocaleString("th-TH")}
              </div>
              <div className="flex flex-wrap gap-2">
                {sub.passed && (
                  <button
                    className="btn-success"
                    onClick={() => setShowCert(true)}
                  >
                    🎖 ดู / พิมพ์ใบประกาศ
                  </button>
                )}
                {sessionId && (
                  <Link href={`/leaderboard/${sessionId}`} className="btn-secondary">
                    ดูกระดานคะแนนสด
                  </Link>
                )}
                <Link href="/dashboard" className="btn-primary">
                  กลับหน้าหลัก
                </Link>
              </div>
            </div>
          </div>

          {/* สรุปต่อชนิดเซลล์ */}
          <h2 className="mb-3 mt-8 text-lg font-semibold">สรุปการนับแต่ละชนิด</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">ชนิด</th>
                  <th className="px-4 py-3 text-right">คุณนับได้</th>
                  <th className="px-4 py-3 text-right">เฉลย</th>
                  <th className="px-4 py-3 text-right">ถูก</th>
                  <th className="px-4 py-3 text-right">% ถูก</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sub.categories.map((c) => {
                  const pct =
                    c.trueCount > 0 ? Math.round((c.correct / c.trueCount) * 100) : 0;
                  return (
                    <tr key={c.key}>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="font-medium">{c.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{c.userCount}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        {c.trueCount}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">
                        {c.correct}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            "rounded-md px-2 py-0.5 text-xs font-semibold " +
                            (pct >= 80
                              ? "bg-emerald-100 text-emerald-700"
                              : pct >= 60
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700")
                          }
                        >
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* รายการเซลล์ — เฉลยทีละใบ */}
          <div className="mt-8 mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">เฉลยรายเซลล์</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showWrongOnly}
                onChange={(e) => setShowWrongOnly(e.target.checked)}
                className="h-4 w-4"
              />
              แสดงเฉพาะที่ตอบผิด ({sub.answers.filter((a) => !a.isCorrect).length} ใบ)
            </label>
          </div>
          {filteredAnswers.length === 0 ? (
            <div className="card p-8 text-center text-emerald-700">
              🎉 ตอบถูกทุกเซลล์!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {filteredAnswers.map((a) => {
                const correct = categoryByKey.get(a.correctType);
                const assigned = a.assignedType ? categoryByKey.get(a.assignedType) : null;
                return (
                  <div
                    key={a.cellId}
                    className={
                      "card overflow-hidden " +
                      (a.isCorrect
                        ? "border-l-4 border-l-emerald-500"
                        : "border-l-4 border-l-rose-500")
                    }
                  >
                    <div className="aspect-square bg-slate-50">
                      <img
                        src={a.imageUrl}
                        alt={a.cellId}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-2 text-xs">
                      <div className="text-slate-500">
                        คุณตอบ:{" "}
                        <span
                          className="font-semibold"
                          style={{ color: assigned?.color || "#94a3b8" }}
                        >
                          {assigned?.label || "ไม่ได้ตอบ"}
                        </span>
                      </div>
                      {!a.isCorrect && (
                        <div className="mt-0.5 text-emerald-700">
                          เฉลย:{" "}
                          <span
                            className="font-semibold"
                            style={{ color: correct?.color || "#0f766e" }}
                          >
                            {correct?.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ใบ Certificate — overlay + พิมพ์ได้ */}
      {showCert && sub.passed && (
        <CertificateOverlay sub={sub} onClose={() => setShowCert(false)} />
      )}
    </>
  );
}

function CertificateOverlay({
  sub,
  onClose,
}: {
  sub: Submission;
  onClose: () => void;
}) {
  const dateStr = new Date(sub.submittedAt).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* เครื่องมือ — ซ่อนตอน print */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 print:hidden">
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            onClick={() => window.print()}
            className="btn-primary"
          >
            🖨 พิมพ์ใบประกาศ
          </button>
          <button onClick={onClose} className="btn-secondary">
            ปิด
          </button>
        </div>
      </div>

      {/* Certificate sheet */}
      <div className="fixed inset-0 z-50 overflow-auto bg-white p-6 print:static print:p-0">
        <div className="cert-sheet mx-auto my-6 aspect-[1.414/1] w-full max-w-4xl border-[12px] border-double border-yellow-700 bg-gradient-to-br from-amber-50 via-white to-amber-50 p-10 shadow-xl print:my-0 print:max-w-none print:shadow-none">
          <div className="flex h-full flex-col items-center justify-between text-center">
            <div>
              <div className="text-xs uppercase tracking-[0.4em] text-yellow-800">
                Certificate of Achievement
              </div>
              <h1 className="mt-2 text-3xl font-bold text-yellow-900 sm:text-4xl">
                ใบประกาศนียบัตร
              </h1>
              <div className="mx-auto mt-2 h-1 w-32 bg-yellow-700" />
            </div>

            <div>
              <p className="text-sm text-slate-600">
                ขอมอบใบประกาศนียบัตรฉบับนี้ให้กับ
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                {sub.fullName}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                @{sub.username} · {sub.hospitalName}
              </p>

              <p className="mt-6 text-sm text-slate-600">
                ได้ผ่านการประเมินความรู้
              </p>
              <p className="mt-1 px-6 text-lg font-semibold text-slate-800">
                "{sub.quizTitle}"
              </p>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs uppercase text-slate-500">คะแนน</div>
                  <div className="text-2xl font-bold text-emerald-700">
                    {sub.correct} / {sub.total}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">เปอร์เซ็นต์</div>
                  <div className="text-2xl font-bold text-emerald-700">
                    {sub.percent}%
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">เกณฑ์ผ่าน</div>
                  <div className="text-2xl font-bold text-slate-700">
                    {sub.passPercent}%
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full">
              <div className="mb-4 mx-auto h-px w-2/3 bg-yellow-700/50" />
              <div className="flex items-end justify-between text-xs text-slate-600">
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">
                    Certificate ID
                  </div>
                  <div className="font-mono text-sm font-semibold">
                    {sub.certificateId}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-base font-semibold text-slate-700">
                    DI EQA Online Assessment
                  </div>
                  <div>ระบบประเมินความรู้ออนไลน์</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">
                    ออกให้เมื่อ
                  </div>
                  <div className="font-semibold">{dateStr}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
