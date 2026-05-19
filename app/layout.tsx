import "./globals.css";
import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import MuiThemeProvider from "@/components/MuiThemeProvider";
import HandTracker from "@/components/HandTracker";

const sarabun = Sarabun({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "DI EQA · ระบบประเมินความรู้",
  description: "ระบบประเมินความรู้และทำข้อสอบสำหรับการอบรม Drug Information",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body className={sarabun.className}>
        <MuiThemeProvider>
          {children}
          <HandTracker />
        </MuiThemeProvider>
      </body>
    </html>
  );
}
