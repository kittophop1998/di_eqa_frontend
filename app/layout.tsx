import "./globals.css";
import type { Metadata } from "next";
import MuiThemeProvider from "@/components/MuiThemeProvider";

export const metadata: Metadata = {
  title: "DI EQA - ระบบประเมินความรู้",
  description: "ระบบประเมินความรู้และทำข้อสอบสำหรับการอบรม Drug Information",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <MuiThemeProvider>
          {children}
        </MuiThemeProvider>
      </body>
    </html>
  );
}
