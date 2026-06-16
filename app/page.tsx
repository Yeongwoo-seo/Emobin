"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  fileToDataUrl, dataUrlToBase64, getMimeFromDataUrl,
  resizeImage, cropProfileSquircle, createBlurredBackground,
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
   KakaoUI (iPhone 14 Pro, 393×852)
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
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Status bar */}
      <div style={{ flexShrink: 0, height: 59, background: "#F5F5F5", display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 28px 8px" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>10:52</span>
        <div style={{ position: "absolute", left: "50%", top: 12, transform: "translateX(-50%)", width: 120, height: 34, background: "#000", borderRadius: 20 }} />
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
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 25, height: 12, border: "1.5px solid #1a1a1a", borderRadius: 3, display: "flex", alignItems: "center", padding: "0 2px" }}>
              <div style={{ width: "80%", height: 7, background: "#1a1a1a", borderRadius: 1 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Nav header */}
      <div style={{ flexShrink: 0, height: 44, background: "#F5F5F5", display: "flex", alignItems: "center", borderBottom: "0.5px solid #D1D1D6", padding: "0 4px" }}>
        <button style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none" }}>
          <svg width="9" height="16" viewBox="0 0 9 16" fill="none">
            <path d="M8 1L1.5 8L8 15" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 17, color: "#1a1a1a", marginLeft: 2 }}>1</span>
        </button>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {result.participantName}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button style={{ width: 40, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="#1a1a1a" strokeWidth="1.8" />
              <line x1="12.5" y1="12.5" x2="17" y2="17" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <button style={{ width: 40, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 3.5C7 3.5 5.5 3.5 4.5 5C3.5 6.5 3.5 8 5 10C6.5 12 9 14.5 11 16C13 17.5 14.5 17.5 16 16.5C17.5 15.5 17.5 14 17.5 14L15 11.5C15 11.5 14 11 13.5 12C13 13 12.5 13.5 12 13C11 12 9 10 8 9C7.5 8.5 8 8 9 7.5C10 7 9.5 6 9.5 6L7 3.5Z" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </button>
          <button style={{ width: 40, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none" }}>
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
              <line x1="1" y1="1" x2="19" y2="1" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="1" y1="8" x2="19" y2="8" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="1" y1="15" x2="19" y2="15" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px", background: bgColor, minHeight: 0 }}>
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
      <div style={{ flexShrink: 0, height: 54, background: "#F5F5F5", borderTop: "0.5px solid #D1D1D6", display: "flex", alignItems: "center", padding: "0 10px", gap: 8 }}>
        <button style={{ width: 34, height: 34, borderRadius: "50%", background: "#E1E1E6", border: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <line x1="8" y1="2" x2="8" y2="14" stroke="#555" strokeWidth="2" strokeLinecap="round" />
            <line x1="2" y1="8" x2="14" y2="8" stroke="#555" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div style={{ flex: 1, height: 36, background: "#fff", borderRadius: 18, border: "0.5px solid #D1D1D6", display: "flex", alignItems: "center", padding: "0 14px" }}>
          <span style={{ fontSize: 15, color: "#AEAEB2" }}>메시지 입력</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="9.5" stroke="#8E8E93" strokeWidth="1.5" />
            <circle cx="8" cy="9.5" r="1" fill="#8E8E93" />
            <circle cx="14" cy="9.5" r="1" fill="#8E8E93" />
            <path d="M7.5 13.5C8.5 15.5 13.5 15.5 14.5 13.5" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <line x1="6" y1="3" x2="4" y2="15" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="3" x2="10" y2="15" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="3" y1="7" x2="15" y2="7" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="2.5" y1="11" x2="14.5" y2="11" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
            <line x1="1" y1="7" x2="3" y2="7" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="4.5" y1="4.5" x2="4.5" y2="9.5" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="7" y1="2" x2="7" y2="12" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="9.5" y1="4" x2="9.5" y2="10" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="1" x2="12" y2="13" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14.5" y1="4" x2="14.5" y2="10" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="17" y1="2" x2="17" y2="12" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="19" y1="4.5" x2="19" y2="9.5" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Home indicator */}
      <div style={{ flexShrink: 0, height: 34, background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 134, height: 5, background: "#1a1a1a", borderRadius: 3, opacity: 0.18 }} />
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

  // Navigation
  const [viewMode, setViewMode] = useState<"controls" | "chat">("controls");

  // Background for controls page
  const [blurredBg, setBlurredBg] = useState<string | null>(null);

  // Chat view: fullscreen scale + swipe state
  const [chatScale, setChatScale] = useState(1);
  const [chatPanel, setChatPanel] = useState<0 | 1>(0); // 0 = KakaoUI, 1 = Original
  const touchStartX = useRef(0);
  const [swipeDelta, setSwipeDelta] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  /* ── Init ── */
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

  /* ── bgColor sync ── */
  useEffect(() => {
    if (result?.backgroundColorHex) setBgColor(result.backgroundColorHex);
  }, [result?.backgroundColorHex]);

  /* ── Profile extraction ── */
  useEffect(() => {
    if (!result?.profileBounds || !screenshot) return;
    cropProfileSquircle(screenshot, result.profileBounds, 200)
      .then(setProfileDataUrl)
      .catch(() => {});
  }, [result?.profileBounds, screenshot]);

  /* ── Blurred background for controls page ── */
  useEffect(() => {
    if (!screenshot) { setBlurredBg(null); return; }
    createBlurredBackground(screenshot).then(setBlurredBg).catch(() => {});
  }, [screenshot]);

  /* ── Chat view scale ── */
  useEffect(() => {
    function update() {
      const s = Math.min(
        window.innerHeight / 852,
        window.innerWidth / 393,
        1
      );
      setChatScale(s);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* ── Reset chat panel when entering chat view ── */
  useEffect(() => {
    if (viewMode === "chat") setChatPanel(0);
  }, [viewMode]);

  /* ── Touch swipe handlers ── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
    setSwipeDelta(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = e.touches[0].clientX - touchStartX.current;
    // Panel 0: only allow right swipe (positive)
    // Panel 1: only allow left swipe (negative)
    if (chatPanel === 0 && delta > 0) setSwipeDelta(delta);
    if (chatPanel === 1 && delta < 0) setSwipeDelta(delta);
  }, [chatPanel]);

  const handleTouchEnd = useCallback(() => {
    setIsSwiping(false);
    const threshold = 60;
    if (chatPanel === 0 && swipeDelta > threshold) setChatPanel(1);
    else if (chatPanel === 1 && swipeDelta < -threshold) setChatPanel(0);
    setSwipeDelta(0);
  }, [chatPanel, swipeDelta]);

  /* ── File drop ── */
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

  /* ── Analysis ── */
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
        setLog((p) => [...p, `❌ ${data.error || `HTTP ${res.status}`}`]);
        setStatus("error");
        return;
      }

      const src = data._source === "mock_no_key" ? "⚠️ 목 데이터" : "✅ Gemini";
      setResult(data as AnalysisResult);
      setLog((p) => [...p, `${src}: 메시지 ${data.messages?.length ?? 0}개`]);
      setStatus("ok");
    } catch (e) {
      setLog((p) => [...p, `❌ ${e}`]);
      setStatus("error");
    }
  }

  /* ════════════════════════
     CHAT VIEW (fullscreen)
  ════════════════════════ */
  if (viewMode === "chat" && result) {
    const panelOffset = chatPanel === 0
      ? `${swipeDelta}px`
      : `calc(-100vw + ${swipeDelta}px)`;

    return (
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#111" }}>
        {/* Slide container: [Panel0: KakaoUI] [Panel1: Original] */}
        <div
          style={{
            display: "flex",
            width: "200vw",
            height: "100%",
            transform: `translateX(${panelOffset})`,
            transition: isSwiping ? "none" : "transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)",
            willChange: "transform",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Panel 0 – KakaoUI */}
          <div style={{ width: "100vw", flexShrink: 0, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: bgColor }}>
            <div style={{ width: 393 * chatScale, height: 852 * chatScale, overflow: "hidden", flexShrink: 0 }}>
              <KakaoUI result={result} bgColor={bgColor} profileDataUrl={profileDataUrl} scale={chatScale} />
            </div>
          </div>

          {/* Panel 1 – Original screenshot */}
          <div style={{ width: "100vw", flexShrink: 0, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
            {screenshot && (
              <img
                src={screenshot}
                alt="원본"
                style={{ maxHeight: "100vh", maxWidth: "100vw", objectFit: "contain" }}
              />
            )}
          </div>
        </div>

        {/* Swipe hint dots */}
        <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                width: chatPanel === i ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: chatPanel === i ? "#fff" : "rgba(255,255,255,0.4)",
                transition: "all 0.2s",
              }}
            />
          ))}
        </div>

        {/* Back button */}
        <button
          onClick={() => setViewMode("controls")}
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            background: "rgba(0,0,0,0.45)",
            border: "none",
            borderRadius: 20,
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            padding: "8px 14px",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            zIndex: 10,
          }}
        >
          ← 돌아가기
        </button>

        {/* Swipe label */}
        {chatPanel === 0 && (
          <div style={{
            position: "absolute",
            bottom: 44,
            left: "50%",
            transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.5)",
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}>
            오른쪽으로 밀면 원본 보기
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════
     CONTROLS VIEW
  ════════════════════════ */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: bgColor,
        position: "relative",
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Blurred screenshot background (말풍선 엄청 흐리게) */}
      {blurredBg && (
        <img
          src={blurredBg}
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(18px) brightness(0.88)",
            opacity: 0.6,
            transform: "scale(1.08)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, padding: "48px 20px 40px", maxWidth: 480, margin: "0 auto" }}>

        {/* Brand */}
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#1a1a1a", marginBottom: 6, letterSpacing: -1 }}>
          이모빈
        </h1>
        <p style={{ fontSize: 14, color: "rgba(0,0,0,0.5)", marginBottom: 32 }}>
          카카오톡 스크린샷 → 대화 재현
        </p>

        {/* API key warning */}
        {apiKeyStatus === "missing" && (
          <div style={{ background: "rgba(255,100,100,0.15)", border: "1px solid rgba(255,100,100,0.3)", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#c0392b", marginBottom: 16 }}>
            🔑 GEMINI_API_KEY 미설정 — 샘플 데이터로 표시됩니다
          </div>
        )}

        {/* Upload card */}
        <div
          style={{
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(16px)",
            borderRadius: 20,
            padding: 20,
            marginBottom: 12,
            border: "1px solid rgba(255,255,255,0.6)",
          }}
        >
          {/* Drop zone */}
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? "#FFEB33" : "rgba(0,0,0,0.15)"}`,
              borderRadius: 14,
              padding: "16px 12px",
              cursor: "pointer",
              background: isDragActive ? "rgba(255,235,51,0.08)" : "transparent",
              transition: "all 0.2s",
              marginBottom: screenshot ? 14 : 0,
            }}
          >
            <input {...getInputProps()} />
            {screenshot ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={screenshot}
                  alt="preview"
                  style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)" }}
                  onLoad={(e) => {
                    const i = e.currentTarget;
                    setImgSize({ w: i.naturalWidth, h: i.naturalHeight });
                  }}
                />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>스크린샷 로드됨</p>
                  <p style={{ fontSize: 11, color: "#999", margin: "2px 0 0" }}>{imgSize.w}×{imgSize.h} · 클릭해서 교체</p>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: "#999", margin: 0, textAlign: "center" }}>
                📂 카카오톡 스크린샷 업로드
              </p>
            )}
          </div>

          {/* Analyze + color row */}
          {screenshot && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={runAnalysis}
                disabled={status === "loading"}
                style={{
                  flex: 1,
                  minWidth: 120,
                  padding: "10px 16px",
                  background: "#FFEB33",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1a1a1a",
                  cursor: status === "loading" ? "not-allowed" : "pointer",
                  opacity: status === "loading" ? 0.6 : 1,
                }}
              >
                {status === "loading" ? "⏳ 분석 중..." : "🤖 분석 시작"}
              </button>

              {/* Color picker */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: bgColor, border: "2px solid rgba(0,0,0,0.1)" }} />
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  style={{ width: 28, height: 28, borderRadius: 6, cursor: "pointer", border: "none", background: "transparent" }}
                  title="배경색"
                />
                {["#B2C7D9", "#E8F4E8", "#F5E6D3", "#E8E8F0", "#2C2C2E"].map((c) => (
                  <div
                    key={c}
                    onClick={() => setBgColor(c)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      background: c,
                      border: bgColor === c ? "2px solid #FFEB33" : "2px solid transparent",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status log */}
        {log.length > 0 && (
          <div style={{ background: "rgba(0,0,0,0.18)", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
            {log.map((l, i) => (
              <p key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", margin: i === 0 ? 0 : "4px 0 0", fontFamily: "monospace" }}>
                {l}
              </p>
            ))}
            {profileDataUrl && (
              <p style={{ fontSize: 12, color: "#4ade80", margin: "4px 0 0" }}>✅ 프로필 추출 완료</p>
            )}
          </div>
        )}

        {/* ── 채팅 보기 CTA ── */}
        {result && (
          <button
            onClick={() => setViewMode("chat")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "18px 22px",
              background: "#FFEB33",
              border: "none",
              borderRadius: 20,
              fontSize: 18,
              fontWeight: 800,
              color: "#1a1a1a",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              letterSpacing: -0.3,
            }}
          >
            <span>채팅 보기</span>
            <span style={{ fontSize: 22 }}>→</span>
          </button>
        )}

        {/* Profile preview (small) */}
        {profileDataUrl && (
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src={profileDataUrl}
              alt="profile"
              style={{ width: 36, height: 36, objectFit: "cover", borderRadius: "22%", border: "2px solid rgba(255,255,255,0.6)" }}
            />
            <span style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", fontWeight: 500 }}>
              {result?.participantName} 프로필 추출됨
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
