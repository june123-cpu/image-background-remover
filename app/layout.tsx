import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Remove Background - AI 智能抠图",
  description: "免费在线 AI 智能抠图工具",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
