"use client";

export type Hospital = {
  id: string;
  code: string;
  name: string;
  logo?: string;
  province?: string;
};

export type User = {
  id: string;
  hospitalId: string;
  username: string;
  fullName: string;
  email?: string;
  role: "user" | "instructor" | "admin";
  hospital?: Hospital;
};

const TOKEN_KEY = "di_eqa_token";
const USER_KEY = "di_eqa_user";
const HOSPITAL_KEY = "di_eqa_hospital";

export const auth = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setSession(token: string, user: User) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (user.hospital) {
      localStorage.setItem(HOSPITAL_KEY, JSON.stringify(user.hospital));
    }
  },
  getUser(): User | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as User; } catch { return null; }
  },
  setHospital(h: Hospital) {
    if (typeof window === "undefined") return;
    localStorage.setItem(HOSPITAL_KEY, JSON.stringify(h));
  },
  getHospital(): Hospital | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(HOSPITAL_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as Hospital; } catch { return null; }
  },
  clearHospital() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(HOSPITAL_KEY);
  },
  logout() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isAuthed(): boolean {
    return !!this.getToken();
  },
};
