import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tarot Practice V2.10 — Light & Dark",
  description: "Website Tarot cá nhân với Rider–Waite, Light/Dark, kéo-thả, lật bài và GPT hỗ trợ đọc trải bài."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
