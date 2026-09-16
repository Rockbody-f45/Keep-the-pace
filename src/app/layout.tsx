import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KEEP THE PACE | F45 연신내",
  description:
    "F45 연신내 출석 이벤트 — 주 3회 F45 출석 + NRC 러닝 챌린지 달성하고 리워드 받기",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#faf9f6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--color-paper)]">
        {children}
      </body>
    </html>
  );
}
