import "./globals.css";
import type { Metadata } from "next";
import { Poppins, Sarabun, JetBrains_Mono } from "next/font/google";
import MuiThemeProvider from "@/components/MuiThemeProvider";
import HandTracker from "@/components/HandTracker";

// Display + UI. Poppins carries the latin geometry; Thai glyphs fall through
// to Sarabun automatically since Poppins has no Thai coverage.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

const sarabun = Sarabun({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sarabun",
});

// Technical values: session codes, scores, certificate IDs, timestamps.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "DI EQA · ระบบประเมินความรู้",
  description: "ระบบประเมินความรู้และทำข้อสอบสำหรับการอบรม Drug Information",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      className={`${poppins.variable} ${sarabun.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <MuiThemeProvider>
          {children}
          {/* <HandTracker /> */}
        </MuiThemeProvider>
      </body>
    </html>
  );
}
