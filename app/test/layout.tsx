import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "이모빈 — 업로드",
};

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#1a1a2e", minHeight: "100dvh" }}>
      {children}
    </div>
  );
}
