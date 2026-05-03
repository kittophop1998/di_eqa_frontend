"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { auth, type Hospital } from "@/lib/auth";

export default function HospitalSelectPage() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (auth.isAuthed()) {
      router.replace("/dashboard");
      return;
    }
    api<Hospital[]>("/api/hospitals", { auth: false })
      .then((list) => setHospitals(list || []))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  const select = async (h: Hospital) => {
    auth.setHospital(h);
    router.push("/login");
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      const h = await api<Hospital>(
        `/api/hospitals/${encodeURIComponent(code.trim().toUpperCase())}`,
        { auth: false }
      );
      auth.setHospital(h);
      router.push("/login");
    } catch (e: any) {
      setErr(e.message || "ไม่พบรหัสโรงพยาบาล");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-2xl font-bold text-white shadow-lg">
            DI
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">DI EQA</h1>
          <p className="mt-1 text-slate-600">
            ระบบประเมินความรู้และทำข้อสอบสำหรับการอบรม
          </p>
        </div>

        <div className="card mt-8 p-6">
          <h2 className="text-lg font-semibold">เลือกโรงพยาบาลของคุณ</h2>
          <p className="mt-1 text-sm text-slate-500">
            เพื่อระบบจะจดจำองค์กรของคุณไว้สำหรับการเข้าใช้งานครั้งต่อไป
          </p>

          <form onSubmit={submitCode} className="mt-5">
            <label className="label">รหัสโรงพยาบาล (Hospital Code)</label>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="เช่น HOSP001"
                className="input"
                required
              />
              <button className="btn-primary" disabled={submitting || !code.trim()}>
                {submitting ? "กำลังตรวจ..." : "ยืนยัน"}
              </button>
            </div>
            {err && <p className="mt-2 text-sm text-rose-600">{err}</p>}
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs uppercase tracking-wide text-slate-400">หรือ</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <label className="label">เลือกจากรายชื่อ</label>
          {loading ? (
            <div className="text-sm text-slate-500">กำลังโหลด...</div>
          ) : (
            <div className="grid max-h-72 gap-2 overflow-y-auto pr-1">
              {hospitals.map((h) => (
                <button
                  key={h.id}
                  onClick={() => select(h)}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-brand-400 hover:bg-brand-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{h.logo || "🏥"}</span>
                    <div>
                      <div className="font-medium">{h.name}</div>
                      <div className="text-xs text-slate-500">{h.code} · {h.province}</div>
                    </div>
                  </div>
                  <span className="text-brand-600">→</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          ตัวอย่างผู้ใช้สำหรับทดสอบ: <code className="rounded bg-slate-100 px-1.5 py-0.5">HOSP001 / trainee01 / trainee1234</code>
        </p>
      </div>
    </main>
  );
}
