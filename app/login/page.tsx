"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { auth, type Hospital, type User } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const h = auth.getHospital();
    if (!h) {
      router.replace("/");
      return;
    }
    setHospital(h);
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital) return;
    setErr("");
    setLoading(true);
    try {
      const data = await api<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          hospitalCode: hospital.code,
          username,
          password,
        }),
      });
      auth.setSession(data.token, data.user);
      router.push("/dashboard");
    } catch (e: any) {
      setErr(e.message || "ไม่สามารถเข้าสู่ระบบ");
    } finally {
      setLoading(false);
    }
  };

  if (!hospital) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50">
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{hospital.logo || "🏥"}</span>
            <div>
              <div className="text-sm text-slate-500">เข้าสู่ระบบในฐานะของ</div>
              <div className="text-lg font-semibold">{hospital.name}</div>
              <div className="text-xs text-slate-500">{hospital.code}</div>
            </div>
          </div>

          <button
            onClick={() => {
              auth.clearHospital();
              router.push("/");
            }}
            className="mt-3 text-xs text-brand-600 hover:underline"
          >
            ← เปลี่ยนโรงพยาบาล
          </button>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <div>
              <label className="label">ชื่อผู้ใช้</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="เช่น trainee01"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>
            {err && (
              <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {err}
              </div>
            )}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-500">
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="font-medium text-brand-600 hover:underline">
              ลงทะเบียน
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
