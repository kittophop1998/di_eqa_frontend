"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (auth.isAuthed()) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-900">
      {/* Banner image — fills entire background */}
      <Image
        src="/images/Bandner.png"
        alt="DI EQA Banner"
        fill
        priority
        className="object-cover object-center opacity-80"
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />

      {/* Content */}
      <div className="relative flex min-h-screen flex-col items-center justify-end pb-24 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg md:text-5xl">
          DI EQA
        </h1>
        <p className="mt-3 text-base text-white/80 drop-shadow md:text-lg">
          ระบบประเมินความรู้และทำข้อสอบสำหรับการอบรม
        </p>

        <button
          onClick={() => router.push("/login")}
          className="mt-8 rounded-2xl bg-brand-600 px-10 py-4 text-lg font-semibold text-white shadow-xl transition hover:bg-brand-700 active:scale-95"
        >
          เข้าสู่ระบบ →
        </button>
      </div>
    </main>
  );
}
