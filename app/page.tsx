"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  fileToDataUrl, dataUrlToBase64, getMimeFromDataUrl,
  resizeImage, cropProfileSquircle,
} from "@/lib/imageUtils";
import type { AnalysisResult } from "@/lib/types";
import MessageBubble from "@/components/chat/MessageBubble";

/* ── 메시지 그룹화 ── */
function groupMessages(messages: AnalysisResult["messages"]) {
  return messages.map((msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    return {
      msg,
      isFirst: !prev || prev.sender !== msg.sender,
      isLast: !next || next.sender !== msg.sender,
    };
  });
}

/* ══════════════════════════════════════
   iPhone 14 Pro KakaoTalk UI (scaled)
══════════════════════════════════════ */
function KakaoUI({
  result,
  bgColor,
  profileDataUrl,
  scale,
}: {
  result: AnalysisResult;
  bgColor: string;
  profileDataUrl: string | null;
  scale: number;
}) {
  const grouped = groupMessages(result.messages ?? []);

  return (
    <div
      style={{
        position: "relative",
        width: 393,
        height: 852,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: bgColor,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Status bar (Dynamic Island style) */}
      <div
        style={{
          flexShrink: 0,
          height: 59,
          background: "#F5F5F5",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "0 28px 8px",
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>
          10:52
        </span>
        {/* Dynamic Island placeholder */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 12,
            transform: "translateX(-50%)",
            width: 120,
            height: 34,
            background: "#000",
            borderRadius: 20,
          }}
        />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
            <rect x="0" y="4" width="3" height="8" rx="1" fill="#1a1a1a" />
            <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" fill="#1a1a1a" />
            <rect x="9" y="0.5" width="3" height="11.5" rx="1" fill="#1a1a1a" />
            <rect x="13.5" y="0" width="3" height="12" rx="1" fill="#1a1a1a" opacity="0.3" />
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <path d="M8 2.5a7 7 0 017 7H1a7 7 0 017-7z" fill="#1a1a1a" />
          </svg>
          <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
            <div style={{ width: 25, height: 12, border: "1.5px solid #1a1a1a", borderRadius: 3, display: "flex", alignItems: "center", padding: "0 2px" }}>
              <div style={{ width: "80%", height: 7, background: "#1a1a1a", borderRadius: 1 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation header */}
      <div
        style={{
          flexShrink: 0,
          height: 44,
          background: "#F5F5F5",
          display: "flex",
          alignItems: "center",
          borderBottom: "0.5px solid #D1D1D6",
          padding: "0 4px",
        }}
      >
        <button style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer" }}>
          <svg width="9" height="16" viewBox="0 0 9 16" fill="none">
            <path d="M8 1L1.5 8L8 15" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 17, color: "#1a1a1a", marginLeft: 2 }}>1</span>
        </button>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {result.participantName}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Search */}
          <button style={{ width: 40, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="#1a1a1a" strokeWidth="1.8"/>
              <line x1="12.5" y1="12.5" x2="17" y2="17" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
          {/* Phone */}
          <button style={{ width: 40, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 3.5C7 3.5 5.5 3.5 4.5 5C3.5 6.5 3.5 8 5 10C6.5 12 9 14.5 11 16C13 17.5 14.5 17.5 16 16.5C17.5 15.5 17.5 14 17.5 14L15 11.5C15 11.5 14 11 13.5 12C13 13 12.5 13.5 12 13C11 12 9 10 8 9C7.5 8.5 8 8 9 7.5C10 7 9.5 6 9.5 6L7 3.5Z" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Menu */}
          <button style={{ width: 40, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer" }}>
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
              <line x1="1" y1="1" x2="19" y2="1" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="1" y1="8" x2="19" y2="8" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="1" y1="15" x2="19" y2="15" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Chat messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 10px",
          background: bgColor,
          minHeight: 0,
        }}
      >
        {grouped.map(({ msg, isFirst, isLast }) => (
          <MessageBubble
            key={msg.id}
            message={{ ...msg, read: true }}
            profileImageDataUrl={profileDataUrl}
            participantName={result.participantName}
            showProfile={msg.sender === "other"}
            showName={isFirst && msg.sender === "other"}
            isFirst={isFirst}
            isLast={isLast}
          />
        ))}
      </div>

      {/* Input bar */}
      <div
        style={{
          flexShrink: 0,
          height: 54,
          background: "#F5F5F5",
          borderTop: "0.5px solid #D1D1D6",
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          gap: 8,
        }}
      >
        {/* + button */}
        <button style={{ width: 34, height: 34, borderRadius: "50%", background: "#E1E1E6", border: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <line x1="8" y1="2" x2="8" y2="14" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
            <line x1="2" y1="8" x2="14" y2="8" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        {/* Text input */}
        <div style={{ flex: 1, height: 36, background: "#fff", borderRadius: 18, border: "0.5px solid #D1D1D6", display: "flex", alignItems: "center", padding: "0 14px" }}>
          <span style={{ fontSize: 15, color: "#AEAEB2" }}>메시지 입력</span>
        </div>
        {/* Right icons */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          {/* Emoji */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="9.5" stroke="#8E8E93" strokeWidth="1.5"/>
            <circle cx="8" cy="9.5" r="1" fill="#8E8E93"/>
            <circle cx="14" cy="9.5" r="1" fill="#8E8E93"/>
            <path d="M7.5 13.5C7.5 13.5 8.5 15.5 11 15.5C13.5 15.5 14.5 13.5 14.5 13.5" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {/* Hashtag */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <line x1="6" y1="3" x2="4" y2="15" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="3" x2="10" y2="15" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="3" y1="7" x2="15" y2="7" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="2.5" y1="11" x2="14.5" y2="11" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {/* Waveform/voice */}
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
            <line x1="1" y1="7" x2="3" y2="7" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="4.5" y1="4.5" x2="4.5" y2="9.5" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="7" y1="2" x2="7" y2="12" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="9.5" y1="4" x2="9.5" y2="10" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="1" x2="12" y2="13" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="14.5" y1="4" x2="14.5" y2="10" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="17" y1="2" x2="17" y2="12" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="19" y1="4.5" x2="19" y2="9.5" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Home indicator */}
      <div style={{ flexShrink: 0, height: 34, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 134, height: 5, background: "#1a1a1a", borderRadius: 3 }} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
export default function TestPage() {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState({ w: 1, h: 1 });
  const [apiKeyStatus, setApiKeyStatus] = useState<"checking" | "ok" | "missing">("checking");

  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [log, setLog] = useState<string[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [bgColor, setBgColor] = useState("#B2C7D9");
  const [profileDataUrl, setProfileDataUrl] = useState<string | null>(null);

  // Scale for iPhone 14 Pro UI (393px wide)
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [uiScale, setUiScale] = useState(1);

  useEffect(() => {
    fetch("/api/check-config")
      .then((r) => r.json())
      .then((d) => setApiKeyStatus(d.apiKeySet ? "ok" : "missing"))
      .catch(() => setApiKeyStatus("missing"));

    fetch("/test.png")
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = () => setScreenshot(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(() => {});
  }, []);

  // Observe right panel width to compute UI scale
  useEffect(() => {
    const el = rightPanelRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setUiScale(entry.contentRect.width / 393);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Sync bgColor when result changes
  useEffect(() => {
    if (result?.backgroundColorHex) setBgColor(result.backgroundColorHex);
  }, [result?.backgroundColorHex]);

  // Extract squircle profile when result + screenshot are ready
  useEffect(() => {
    if (!result?.profileBounds || !screenshot) return;
    cropProfileSquircle(screenshot, result.profileBounds, 200)
      .then(setProfileDataUrl)
      .catch(() => {});
  }, [result?.profileBounds, screenshot]);

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return;
    const url = await fileToDataUrl(files[0]);
    setScreenshot(url);
    setStatus("idle"); setResult(null); setLog([]);
    setProfileDataUrl(null); setBgColor("#B2C7D9");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "image/*": [] }, maxFiles: 1,
  });

  async function runAnalysis() {
    if (!screenshot) return;
    setStatus("loading");
    setLog(["이미지 준비 중..."]);
    setResult(null);
    setProfileDataUrl(null);
    try {
      const resized = await resizeImage(screenshot, 1280, 1280);
      const b64 = dataUrlToBase64(resized);
      const mime = getMimeFromDataUrl(resized);

      setLog((p) => [...p, "Gemini 분석 중..."]);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: b64, mimeType: mime }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setLog((p) => [...p, `❌ 실패: ${data.error || `HTTP ${res.status}`}`]);
        setStatus("error");
        return;
      }

      const src = data._source === "mock_no_key" ? "⚠️ 목 데이터" : "✅ Gemini 분석";
      setResult(data as AnalysisResult);
      setLog((p) => [...p, `${src}: 메시지 ${data.messages?.length ?? 0}개`]);
      setStatus("ok");
    } catch (e) {
      setLog((p) => [...p, `❌ ${e}`]);
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Top bar */}
      <div className="bg-[#FFEB33] px-4 py-3 flex items-center justify-between">
        <h1 className="text-gray-900 font-black text-lg">이모빈 · 카톡 UI 구현 테스트</h1>
        <a href="/test" className="text-gray-700 text-xs border border-gray-600/40 px-3 py-1.5 rounded-full">홈</a>
      </div>

      <div className="p-4 max-w-6xl mx-auto space-y-4">

        {/* API key status */}
        {apiKeyStatus === "missing" && (
          <div className="bg-red-900/40 border border-red-500/50 rounded-xl px-4 py-3 text-[12px] text-red-300">
            🔑 GEMINI_API_KEY 미설정 — 샘플 데이터로 표시됩니다.
            (<a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline text-blue-400">발급 바로가기</a>
            → <code>.env.local</code>에 GEMINI_API_KEY=AIza... 추가)
          </div>
        )}

        {/* Controls row */}
        <div className="flex gap-3 items-start flex-wrap">
          {/* Upload */}
          <div
            {...getRootProps()}
            className={`flex-shrink-0 border-2 border-dashed rounded-xl px-4 py-2.5 cursor-pointer transition-all text-sm ${
              isDragActive ? "border-yellow-400 bg-yellow-400/10" :
              screenshot ? "border-green-500/50 bg-green-900/10" :
              "border-gray-700 hover:border-gray-500"
            }`}
          >
            <input {...getInputProps()} />
            {screenshot ? (
              <div className="flex items-center gap-2">
                <img src={screenshot} alt="preview" className="w-8 h-8 object-cover rounded border border-gray-600"
                  onLoad={(e) => { const i = e.currentTarget; setImgSize({ w: i.naturalWidth, h: i.naturalHeight }); }} />
                <div>
                  <p className="text-green-400 text-xs font-semibold">✓ 로드됨</p>
                  <p className="text-gray-500 text-[10px]">{imgSize.w}×{imgSize.h} · 클릭 교체</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">📂 스크린샷 업로드</p>
            )}
          </div>

          {/* Analyze button */}
          <button
            onClick={runAnalysis}
            disabled={!screenshot || status === "loading"}
            className="flex-shrink-0 px-5 py-2.5 bg-[#FFEB33] text-gray-900 font-bold rounded-xl text-sm disabled:opacity-40 active:brightness-90 transition-all"
          >
            {status === "loading" ? "⏳ 분석 중..." : "🤖 분석 시작"}
          </button>

          {/* Background color picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-lg border-2 border-gray-600 flex-shrink-0" style={{ background: bgColor }} />
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-gray-600 bg-transparent flex-shrink-0"
              title="배경색 선택"
            />
            <input
              type="text"
              value={bgColor}
              onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setBgColor(e.target.value); }}
              className="w-24 bg-gray-800 text-white text-[12px] font-mono px-2 py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:border-yellow-400"
              maxLength={7}
            />
            {["#B2C7D9", "#E8F4E8", "#F5E6D3", "#E8E8F0", "#2C2C2E"].map((c) => (
              <button
                key={c}
                onClick={() => setBgColor(c)}
                className="w-6 h-6 rounded border-2 transition-all flex-shrink-0"
                style={{ background: c, borderColor: bgColor === c ? "#FFEB33" : "transparent" }}
              />
            ))}
          </div>
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div className="bg-black/30 rounded-xl px-3 py-2 flex gap-3 flex-wrap">
            {log.map((l, i) => (
              <span key={i} className="text-[11px] font-mono text-gray-400">{l}</span>
            ))}
            {profileDataUrl && (
              <span className="text-[11px] text-green-400">✅ 프로필 추출 완료 (squircle)</span>
            )}
          </div>
        )}

        {/* ── 좌우 비교 ── */}
        <div className="grid grid-cols-2 gap-4">

          {/* LEFT: 원본 스크린샷 */}
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">원본 스크린샷</p>
            {screenshot ? (
              <img src={screenshot} alt="original" className="w-full rounded-2xl border border-gray-700 shadow-lg" />
            ) : (
              <div className="rounded-2xl border border-gray-700 aspect-[393/852] flex items-center justify-center text-gray-600 text-sm">
                스크린샷 없음
              </div>
            )}
          </div>

          {/* RIGHT: 구현 UI (iPhone 14 Pro 기준) */}
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">
              구현 UI — iPhone 14 Pro (393 × 852)
            </p>
            {/* Outer: maintains 393:852 aspect ratio, clips overflow */}
            <div
              ref={rightPanelRef}
              className="w-full rounded-2xl overflow-hidden border border-gray-700 shadow-lg"
              style={{ aspectRatio: "393/852", position: "relative" }}
            >
              {result ? (
                <KakaoUI
                  result={result}
                  bgColor={bgColor}
                  profileDataUrl={profileDataUrl}
                  scale={uiScale}
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm"
                  style={{ background: bgColor }}
                >
                  {status === "loading" ? "분석 중..." : "분석 후 표시됩니다"}
                </div>
              )}
            </div>

            {/* Profile preview */}
            {profileDataUrl && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={profileDataUrl}
                  alt="extracted profile"
                  className="w-10 h-10 object-cover shadow"
                  style={{ borderRadius: "28%" }}
                />
                <div className="text-[10px] text-gray-400">
                  <p className="text-gray-300 font-semibold">추출된 프로필 (squircle)</p>
                  <p>{result?.participantName}</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
