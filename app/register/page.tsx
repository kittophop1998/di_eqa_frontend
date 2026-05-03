"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { auth, type Hospital, type User } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
  });
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

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital) return;
    setErr("");
    setLoading(true);
    try {
      const data = await api<{ token: string; user: User }>("/api/auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          hospitalCode: hospital.code,
          ...form,
        }),
      });
      auth.setSession(data.token, data.user);
      router.push("/dashboard");
    } catch (e: any) {
      setErr(e.message || "ลงทะเบียนไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  if (!hospital) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50">
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{hospital.logo || "🏥"}</span>
            <div>
              <div className="text-sm text-slate-500">ลงทะเบียนสำหรับ</div>
              <div className="text-lg font-semibold">{hospital.name}</div>
              <div className="text-xs text-slate-500">{hospital.code}</div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <div>
              <label className="label">ชื่อ-นามสกุล</label>
              <input value={form.fullName} onChange={set("fullName")} className="input" required />
            </div>
            <div>
              <label className="label">ชื่อผู้ใช้ (ตัวพิมพ์เล็ก)</label>
              <input value={form.username} onChange={set("username")} className="input" minLength={3} required />
            </div>
            <div>
              <label className="label">อีเมล (ไม่บังคับ)</label>
              <input type="email" value={form.email} onChange={set("email")} className="input" />
            </div>
            <div>
              <label className="label">รหัสผ่าน</label>
              <input type="password" value={form.password} onChange={set("password")} className="input" minLength={6} required />
            </div>
            {err && (
              <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {err}
              </div>
            )}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "กำลังสมัคร..." : "ลงทะเบียน"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-500">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:underline">
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
