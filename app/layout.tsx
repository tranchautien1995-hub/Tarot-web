import type { Metadata, Viewport } from "next";
import AuthGate from "@/components/AuthGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "TTarot Home",
  description: "Website Tarot cá nhân với Rider–Waite, Light/Dark, kéo-thả, lật bài và GPT hỗ trợ đọc trải bài."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" data-theme="dark">
      <body><AuthGate>{children}</AuthGate></body>
    </html>
  );
}
