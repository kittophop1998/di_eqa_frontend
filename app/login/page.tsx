"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { auth, type Hospital, type User } from "@/lib/auth";

type Mode = "user" | "admin";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("user");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalId, setHospitalId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);

  useEffect(() => {
    if (auth.isAuthed()) {
      router.replace("/dashboard");
      return;
    }
    api<Hospital[]>("/api/hospitals", { auth: false })
      .then((list) => setHospitals(list || []))
      .catch(() => {})
      .finally(() => setHospitalsLoading(false));
  }, [router]);

  const selectedHospital = hospitals.find((h) => h.id === hospitalId) ?? null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "user" && !selectedHospital) {
      setErr("กรุณาเลือกโรงพยาบาล");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const body: Record<string, string | boolean> = { username, password };
      if (mode === "user" && selectedHospital) {
        body.hospitalCode = selectedHospital.code;
      }
      if (mode === "admin") {
        body.isAdmin = true;
      }
      const data = await api<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify(body),
      });
      if (selectedHospital) auth.setHospital(selectedHospital);
      auth.setSession(data.token, data.user);
      router.push(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (e: any) {
      setErr(e.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Google Font: Sarabun */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        .login-root { font-family: 'Sarabun', sans-serif; }
      `}</style>

      <main
        className="login-root min-h-screen flex items-center justify-center px-4 py-12"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, #dbeafe 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, #ede9fe 0%, transparent 50%), #F8FAFC",
        }}
      >
        {/* Subtle dot pattern overlay */}
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, #94a3b820 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-lg"
              style={{ background: "linear-gradient(135deg,#1D4ED8,#3b82f6)" }}
            >
              DI
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                DI EQA
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                ระบบประเมินความรู้และทำข้อสอบสำหรับการอบรม
              </p>
            </div>
          </div>

          {/* Glassmorphism card */}
          <div
            className="rounded-2xl border border-white/70 p-8 shadow-2xl"
            style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
            }}
          >
            {/* Tab switcher */}
            <div
              className="relative mb-7 flex rounded-xl p-1"
              style={{ background: "#EFF3FB" }}
            >
              {/* Sliding indicator */}
              <span
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow-md transition-all duration-300"
                style={{
                  background: "white",
                  left: mode === "user" ? "4px" : "calc(50%)",
                }}
              />
              {(["user", "admin"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setErr(""); setUsername(""); setPassword(""); }}
                  className="relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors duration-200"
                  style={{
                    color: mode === m ? "#1D4ED8" : "#6B7280",
                  }}
                >
                  {m === "user" ? (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      เข้าสู่ระบบ
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      ผู้ดูแลระบบ
                    </>
                  )}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              {/* Hospital dropdown */}
              {mode === "user" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    โรงพยาบาล
                  </label>
                  <div className="relative">
                    {/* hospital icon */}
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </span>
                    {hospitalsLoading ? (
                      <div
                        className="flex h-11 w-full items-center rounded-xl border pl-10 text-sm text-slate-400"
                        style={{ borderColor: "#E2E8F0", background: "#F8FAFC" }}
                      >
                        กำลังโหลด...
                      </div>
                    ) : (
                      <select
                        value={hospitalId}
                        onChange={(e) => setHospitalId(e.target.value)}
                        required
                        className="h-11 w-full appearance-none rounded-xl border bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        style={{ borderColor: "#E2E8F0" }}
                      >
                        <option value="">-- เลือกโรงพยาบาล --</option>
                        {hospitals.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}{h.province ? ` (${h.province})` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}

              {/* Username */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  ชื่อผู้ใช้
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={mode === "admin" ? "admin" : "เช่น trainee01"}
                    required
                    autoFocus
                    className="h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: "#E2E8F0" }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-11 w-full rounded-xl border bg-white pl-10 pr-11 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: "#E2E8F0" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {err && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {err}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: loading
                    ? "#93c5fd"
                    : "linear-gradient(135deg,#1D4ED8 0%,#3b82f6 100%)",
                }}
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  "เข้าสู่ระบบ"
                )}
              </button>
            </form>

            {mode === "user" && (
              <p className="mt-5 text-center text-sm text-slate-500">
                ยังไม่มีบัญชี?{" "}
                <Link
                  href="/register"
                  className="font-semibold hover:underline"
                  style={{ color: "#1D4ED8" }}
                >
                  ลงทะเบียน
                </Link>
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} DI EQA · ระบบประเมินความชำนาญทางการแพทย์
          </p>
        </div>
      </main>
    </>
  );
}
