import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "이모빈 UI 분석 테스트",
};

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", background: "#111827", maxWidth: "100%", margin: 0 }}>
      {children}
    </div>
  );
}
