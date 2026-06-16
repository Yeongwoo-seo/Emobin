"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { useEmobinStore } from "@/lib/store";
import type { AnalysisResult, ChatMessage, ProfileBounds } from "@/lib/types";
import {
  fileToDataUrl,
  dataUrlToBase64,
  getMimeFromDataUrl,
  cropProfileCircle,
  resizeImage,
  createBlurredBackground,
} from "@/lib/imageUtils";
import { v4 as uuidv4 } from "uuid";

/* ─────────────────────────────────────────
   Mini KakaoTalk Chat Preview (self-contained)
───────────────────────────────────────── */
function MiniChatBubble({
  msg,
  profileImg,
  name,
  showProfile,
  showName,
}: {
  msg: ChatMessage;
  profileImg: string | null;
  name: string;
  showProfile: boolean;
  showName: boolean;
}) {
  const isMe = msg.sender === "me";
  return (
    <div
      className={`flex items-end gap-1.5 mb-0.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Profile pic area (other only) */}
      <div className="w-8 flex-shrink-0 self-end mb-1">
        {!isMe && showProfile && (
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border border-gray-300">
            {profileImg ? (
              <img src={profileImg} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                <span className="text-white text-[10px]">?</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        className={`flex flex-col max-w-[65%] ${isMe ? "items-end" : "items-start"}`}
      >
        {!isMe && showName && (
          <span className="text-[10px] text-gray-600 font-medium mb-0.5 ml-0.5">
            {name}
          </span>
        )}
        <div className={`flex items-end gap-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          <div
            className={`px-2.5 py-1.5 text-[12px] leading-snug break-words ${
              isMe
                ? "bg-[#FFEB33] text-gray-900"
                : "bg-white text-gray-900 shadow-sm"
            }`}
            style={{
              borderRadius: isMe ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
            }}
          >
            {msg.text}
          </div>
          <div
            className={`flex flex-col gap-0 pb-0.5 flex-shrink-0 ${
              isMe ? "items-end" : "items-start"
            }`}
          >
            {(msg.unreadCount ?? 0) > 0 && (
              <span className="text-[9px] text-[#FFEB33] font-bold leading-none">
                {msg.unreadCount}
              </span>
            )}
            <span className="text-[9px] text-gray-400 leading-none whitespace-nowrap">
              {msg.time}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function KakaoPreview({
  name,
  messages,
  profileImg,
  bgColor,
  bgDataUrl,
}: {
  name: string;
  messages: ChatMessage[];
  profileImg: string | null;
  bgColor: string;
  bgDataUrl: string | null;
}) {
  // Group messages by consecutive sender
  const groups: ChatMessage[][] = [];
  let cur: ChatMessage[] = [];
  let curSender: string | null = null;
  for (const m of messages) {
    if (m.sender !== curSender) {
      if (cur.length) groups.push(cur);
      cur = [m];
      curSender = m.sender;
    } else {
      cur.push(m);
    }
  }
  if (cur.length) groups.push(cur);

  return (
    <div
      className="rounded-xl overflow-hidden border border-gray-600"
      style={{ maxWidth: 320, width: "100%" }}
    >
      {/* Status bar */}
      <div className="bg-[#F5F5F5] px-3 py-1 flex justify-between items-center">
        <span className="text-[10px] font-semibold text-gray-700">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-2 border border-gray-500 rounded-sm flex items-center px-px">
            <div className="w-2.5 h-1 bg-gray-500 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-[#F5F5F5] border-b border-gray-200 px-2 py-1.5 flex items-center gap-2">
        <span className="text-gray-600 text-sm">‹</span>
        {profileImg && (
          <img src={profileImg} className="w-6 h-6 rounded-full object-cover" alt="profile" />
        )}
        <span className="text-[13px] font-bold text-gray-900 flex-1">{name}</span>
        <span className="text-[11px] text-gray-400">1</span>
        <span className="text-gray-400 text-sm">···</span>
      </div>

      {/* Chat area */}
      <div
        className="p-2 overflow-y-auto"
        style={{
          minHeight: 180,
          maxHeight: 320,
          backgroundImage: bgDataUrl ? `url(${bgDataUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: bgColor,
        }}
      >
        {/* Date label */}
        <div className="flex justify-center mb-2">
          <span className="bg-black/25 text-white text-[9px] px-2 py-0.5 rounded-full">
            오늘
          </span>
        </div>

        {groups.map((group) =>
          group.map((msg, i) => (
            <MiniChatBubble
              key={msg.id}
              msg={msg}
              profileImg={profileImg}
              name={name}
              showProfile={i === group.length - 1}
              showName={i === 0}
            />
          ))
        )}
      </div>

      {/* Input bar */}
      <div className="bg-[#F4F4F4] border-t border-gray-200 px-2 py-1.5 flex items-center gap-1.5">
        <span className="text-gray-400 text-[18px]">⊕</span>
        <div className="flex-1 bg-white rounded-full border border-gray-200 px-3 py-1">
          <span className="text-gray-400 text-[11px]">메시지를 입력하세요</span>
        </div>
        <span className="text-gray-400 text-sm">☺</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Section wrapper
───────────────────────────────────────── */
function Section({
  title,
  badge,
  children,
  defaultOpen = true,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-750"
      >
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-bold text-sm">{title}</span>
          {badge && (
            <span className="bg-yellow-400/20 text-yellow-300 text-[10px] px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Test Page
───────────────────────────────────────── */
export default function TestPage() {
  const router = useRouter();
  const setChatRoomData = useEmobinStore((s) => s.setChatRoomData);

  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 1, h: 1 });
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [rawAnalysis, setRawAnalysis] = useState<AnalysisResult | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");

  // Editable extracted data
  const [name, setName] = useState("상대방");
  const [bounds, setBounds] = useState<ProfileBounds>({
    xPercent: 0.03,
    yPercent: 0.14,
    widthPercent: 0.11,
    heightPercent: 0.055,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [bgColor, setBgColor] = useState("#B2C7D9");
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [bgDataUrl, setBgDataUrl] = useState<string | null>(null);
  const [extractingProfile, setExtractingProfile] = useState(false);

  /* ── Upload ── */
  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return;
    const dataUrl = await fileToDataUrl(files[0]);
    setScreenshot(dataUrl);
    setRawAnalysis(null);
    setMessages([]);
    setProfileImg(null);
    setBgDataUrl(null);
    setAnalysisStatus("");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  /* ── Re-extract profile whenever bounds or screenshot changes ── */
  useEffect(() => {
    if (!screenshot) return;
    setExtractingProfile(true);
    cropProfileCircle(screenshot, bounds, 200)
      .then((url) => {
        setProfileImg(url);
        setExtractingProfile(false);
      })
      .catch(() => {
        setExtractingProfile(false);
      });
  }, [screenshot, bounds]);

  /* ── Generate blurred background ── */
  useEffect(() => {
    if (!screenshot) return;
    createBlurredBackground(screenshot)
      .then(setBgDataUrl)
      .catch(() => setBgDataUrl(null));
  }, [screenshot]);

  /* ── Analyze ── */
  const handleAnalyze = async () => {
    if (!screenshot) return;
    setAnalyzing(true);
    setAnalysisStatus("이미지 리사이즈 중...");
    try {
      const resized = await resizeImage(screenshot, 1024, 1024);
      const b64 = dataUrlToBase64(resized);
      const mime = getMimeFromDataUrl(resized);

      setAnalysisStatus("Claude AI로 분석 중... (10~30초 소요)");
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: b64, mimeType: mime }),
      });

      if (!res.ok) throw new Error(`API Error ${res.status}`);
      const data: AnalysisResult = await res.json();

      setRawAnalysis(data);
      setJsonText(JSON.stringify(data, null, 2));
      applyAnalysis(data);
      setAnalysisStatus(`✅ 완료! 메시지 ${data.messages?.length ?? 0}개 추출`);
    } catch (e: unknown) {
      setAnalysisStatus(`❌ 오류: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setAnalyzing(false);
    }
  };

  function applyAnalysis(data: AnalysisResult) {
    setName(data.participantName || "상대방");
    if (data.profileBounds) setBounds(data.profileBounds);
    setBgColor(data.backgroundColorHex || "#B2C7D9");
    setMessages(
      (data.messages || []).map((m) => ({
        ...m,
        id: uuidv4(),
        read: true,
        unreadCount: m.sender === "other" ? 1 : 0,
      }))
    );
  }

  /* ── JSON edit ── */
  const handleApplyJson = () => {
    setJsonError("");
    try {
      const parsed: AnalysisResult = JSON.parse(jsonText);
      setRawAnalysis(parsed);
      applyAnalysis(parsed);
    } catch {
      setJsonError("JSON 파싱 오류 - 문법을 확인하세요");
    }
  };

  /* ── Message ops ── */
  const addMessage = () => {
    const now = new Date();
    const h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, "0");
    setMessages((prev) => [
      ...prev,
      {
        id: uuidv4(),
        text: "새 메시지",
        sender: "other",
        time: `${h >= 12 ? "오후" : "오전"} ${h % 12 || 12}:${m}`,
        read: true,
        unreadCount: 1,
      },
    ]);
  };

  const updateMsg = (id: string, key: keyof ChatMessage, val: string | number | boolean) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: val } : m)));

  const removeMsg = (id: string) =>
    setMessages((prev) => prev.filter((m) => m.id !== id));

  const moveMsg = (id: string, dir: -1 | 1) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  };

  /* ── Save & Go ── */
  const handleSaveAndGo = () => {
    if (!screenshot || messages.length === 0) return;
    setChatRoomData({
      participantName: name,
      profileImageDataUrl: profileImg,
      backgroundDataUrl: bgDataUrl,
      backgroundColorHex: bgColor,
      messages,
      screenshotDataUrl: screenshot,
    });
    router.push("/chat");
  };

  /* ─────── render ─────── */
  return (
    <div className="min-h-screen bg-gray-900 text-white pb-10">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-yellow-400 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔬</span>
          <div>
            <h1 className="text-gray-900 font-extrabold text-base leading-tight">
              이모빈 UI 분석 디버거
            </h1>
            <p className="text-gray-700 text-[10px]">스크린샷 → AI 분석 → 말풍선 추출 + 수동 조정</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/")}
          className="text-gray-700 text-xs bg-black/10 px-3 py-1.5 rounded-full"
        >
          홈으로
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* ── 1. Upload ── */}
        <Section title="📸 1. 스크린샷 업로드" defaultOpen>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-yellow-400 bg-yellow-400/10"
                : "border-gray-600 hover:border-yellow-400/60"
            }`}
          >
            <input {...getInputProps()} />
            {screenshot ? (
              <p className="text-green-400 text-sm">
                ✓ 이미지 로드됨 — 다른 파일을 드롭하거나 클릭해서 교체
              </p>
            ) : (
              <p className="text-gray-400 text-sm">
                카카오톡 스크린샷을 드롭하거나 클릭해서 업로드
              </p>
            )}
          </div>

          {screenshot && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full mt-3 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl disabled:opacity-50 transition-opacity text-sm"
            >
              {analyzing ? "⏳ AI 분석 중..." : "🤖 AI 분석 시작 (Claude Vision)"}
            </button>
          )}

          {analysisStatus && (
            <p
              className={`mt-2 text-xs text-center ${
                analysisStatus.startsWith("✅")
                  ? "text-green-400"
                  : analysisStatus.startsWith("❌")
                  ? "text-red-400"
                  : "text-yellow-300"
              }`}
            >
              {analysisStatus}
            </p>
          )}
        </Section>

        {/* ── 2. Screenshot + Preview side-by-side ── */}
        {screenshot && (
          <Section
            title="📱 2. 원본 vs 카카오톡 UI 비교"
            badge={`메시지 ${messages.length}개`}
          >
            <div className="grid grid-cols-2 gap-3">
              {/* Original screenshot with bounds overlay */}
              <div>
                <p className="text-[10px] text-gray-400 mb-1 font-semibold uppercase tracking-wide">
                  원본 스크린샷
                </p>
                <div
                  className="relative rounded-lg overflow-hidden bg-black"
                  style={{ aspectRatio: `${imgNaturalSize.w}/${imgNaturalSize.h}` }}
                >
                  <img
                    src={screenshot}
                    className="w-full h-full object-contain"
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      setImgNaturalSize({
                        w: img.naturalWidth,
                        h: img.naturalHeight,
                      });
                    }}
                  />
                  {/* Profile bounds highlight */}
                  <div
                    className="absolute border-2 border-red-500 rounded"
                    style={{
                      left: `${bounds.xPercent * 100}%`,
                      top: `${bounds.yPercent * 100}%`,
                      width: `${bounds.widthPercent * 100}%`,
                      height: `${bounds.heightPercent * 100}%`,
                      background: "rgba(239,68,68,0.25)",
                    }}
                  >
                    <span
                      className="absolute bg-red-500 text-white rounded px-1"
                      style={{ fontSize: 8, top: -16, left: 0, whiteSpace: "nowrap" }}
                    >
                      프로필 영역
                    </span>
                  </div>
                </div>
              </div>

              {/* KakaoTalk Preview */}
              <div>
                <p className="text-[10px] text-gray-400 mb-1 font-semibold uppercase tracking-wide">
                  카카오톡 UI 미리보기
                </p>
                <KakaoPreview
                  name={name}
                  messages={messages}
                  profileImg={profileImg}
                  bgColor={bgColor}
                  bgDataUrl={bgDataUrl}
                />
              </div>
            </div>
          </Section>
        )}

        {/* ── 3. Profile bounds editor ── */}
        {screenshot && (
          <Section title="👤 3. 프로필 사진 위치 조정" defaultOpen>
            <div className="flex gap-4">
              {/* Profile preview circle */}
              <div className="flex-shrink-0 text-center">
                <p className="text-[10px] text-gray-400 mb-1">추출 결과</p>
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-gray-500 bg-gray-700 flex items-center justify-center">
                  {extractingProfile ? (
                    <span className="text-[9px] text-gray-400">처리중...</span>
                  ) : profileImg ? (
                    <img
                      src={profileImg}
                      className="w-full h-full object-cover"
                      alt="profile"
                    />
                  ) : (
                    <span className="text-[9px] text-gray-500">없음</span>
                  )}
                </div>
                {profileImg && (
                  <p className="text-[9px] text-green-400 mt-1">✓ 추출됨</p>
                )}
              </div>

              {/* Sliders */}
              <div className="flex-1 space-y-3">
                {(
                  [
                    { key: "xPercent", label: "X 위치 (←→)", max: 0.5 },
                    { key: "yPercent", label: "Y 위치 (↑↓)", max: 1.0 },
                    { key: "widthPercent", label: "너비", max: 0.4 },
                    { key: "heightPercent", label: "높이", max: 0.4 },
                  ] as const
                ).map(({ key, label, max }) => (
                  <div key={key}>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                      <span>{label}</span>
                      <span className="font-mono text-yellow-300">
                        {(bounds[key] * 100).toFixed(2)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={max}
                      step={0.001}
                      value={bounds[key]}
                      onChange={(e) =>
                        setBounds((prev) => ({ ...prev, [key]: +e.target.value }))
                      }
                      className="w-full h-1.5 accent-yellow-400 cursor-pointer"
                    />
                  </div>
                ))}

                <div className="bg-gray-900 rounded-lg p-2 mt-1">
                  <p className="text-[9px] text-gray-500 mb-1">현재 bounds JSON</p>
                  <p className="text-[9px] text-green-300 font-mono break-all">
                    {JSON.stringify(bounds)}
                  </p>
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* ── 4. Message editor ── */}
        <Section
          title="💬 4. 메시지 편집"
          badge={`${messages.length}개`}
          defaultOpen={messages.length > 0}
        >
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              아직 메시지가 없습니다. AI 분석 후 자동으로 채워지거나 직접 추가하세요.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {messages.map((msg, i) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 items-center p-2 rounded-lg border transition-colors ${
                    msg.sender === "me"
                      ? "bg-yellow-900/20 border-yellow-800/50"
                      : "bg-gray-700/60 border-gray-600/50"
                  }`}
                >
                  {/* Index */}
                  <span className="text-[10px] text-gray-500 w-4 text-center flex-shrink-0">
                    {i + 1}
                  </span>

                  {/* Order buttons */}
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => moveMsg(msg.id, -1)}
                      disabled={i === 0}
                      className="text-gray-400 hover:text-white disabled:opacity-20 text-[10px] leading-none"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveMsg(msg.id, 1)}
                      disabled={i === messages.length - 1}
                      className="text-gray-400 hover:text-white disabled:opacity-20 text-[10px] leading-none"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Sender toggle */}
                  <button
                    onClick={() =>
                      updateMsg(
                        msg.id,
                        "sender",
                        msg.sender === "me" ? "other" : "me"
                      )
                    }
                    className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 transition-colors ${
                      msg.sender === "me"
                        ? "bg-yellow-400 text-gray-900"
                        : "bg-white text-gray-900"
                    }`}
                  >
                    {msg.sender === "me" ? "나" : "상대"}
                  </button>

                  {/* Text input */}
                  <input
                    value={msg.text}
                    onChange={(e) => updateMsg(msg.id, "text", e.target.value)}
                    className="flex-1 bg-gray-900/50 text-white text-[11px] px-2 py-1 rounded border border-gray-600 min-w-0 focus:outline-none focus:border-yellow-400"
                    placeholder="메시지 내용"
                  />

                  {/* Time input */}
                  <input
                    value={msg.time}
                    onChange={(e) => updateMsg(msg.id, "time", e.target.value)}
                    className="w-[72px] bg-gray-900/50 text-white text-[10px] px-1.5 py-1 rounded border border-gray-600 focus:outline-none focus:border-yellow-400 flex-shrink-0"
                    placeholder="오후 2:14"
                  />

                  {/* Unread count */}
                  <input
                    type="number"
                    value={msg.unreadCount ?? 0}
                    onChange={(e) =>
                      updateMsg(msg.id, "unreadCount", +e.target.value)
                    }
                    min={0}
                    max={99}
                    className="w-10 bg-gray-900/50 text-yellow-300 text-[10px] px-1 py-1 rounded border border-gray-600 text-center focus:outline-none flex-shrink-0"
                    title="안읽음 수"
                  />

                  {/* Delete */}
                  <button
                    onClick={() => removeMsg(msg.id)}
                    className="text-red-400 hover:text-red-300 text-sm flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={addMessage}
              className="text-[11px] text-yellow-400 border border-yellow-400/40 px-3 py-1.5 rounded-lg hover:bg-yellow-400/10 transition-colors"
            >
              + 메시지 추가
            </button>
            <button
              onClick={() =>
                setMessages((prev) =>
                  prev.map((m) => ({ ...m, unreadCount: m.sender === "other" ? 1 : 0 }))
                )
              }
              className="text-[11px] text-gray-400 border border-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              읽음수 초기화
            </button>
          </div>
        </Section>

        {/* ── 5. Background ── */}
        {screenshot && (
          <Section title="🎨 5. 배경 설정">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-[11px] text-gray-400">배경 색상:</label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="bg-gray-900 text-white px-2 py-1 rounded font-mono text-xs border border-gray-600 focus:outline-none w-24"
                />
              </div>

              <div>
                <p className="text-[11px] text-gray-400 mb-1.5">카카오톡 기본 배경 팔레트:</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { color: "#B2C7D9", name: "기본 파랑" },
                    { color: "#E8DDD1", name: "베이지" },
                    { color: "#D4E8D0", name: "민트" },
                    { color: "#E8D4D4", name: "핑크" },
                    { color: "#D4D4E8", name: "라벤더" },
                    { color: "#F5F0E8", name: "아이보리" },
                    { color: "#2C2C2C", name: "다크" },
                  ].map(({ color, name }) => (
                    <button
                      key={color}
                      onClick={() => setBgColor(color)}
                      title={name}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        bgColor === color ? "border-yellow-400 scale-110" : "border-gray-600"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {bgDataUrl && (
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">블러 배경 미리보기:</p>
                  <img
                    src={bgDataUrl}
                    className="w-full rounded-lg opacity-70"
                    style={{ maxHeight: 100, objectFit: "cover" }}
                    alt="blurred bg"
                  />
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── 6. Name editor ── */}
        <Section title="📝 6. 이름 수정">
          <div className="flex gap-2 items-center">
            {profileImg && (
              <img
                src={profileImg}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                alt="profile"
              />
            )}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-yellow-400 text-sm"
              placeholder="상대방 이름"
            />
          </div>
        </Section>

        {/* ── 7. Raw JSON editor ── */}
        {rawAnalysis && (
          <Section title="🔧 7. AI 분석 JSON 직접 편집" defaultOpen={false}>
            <p className="text-[10px] text-gray-500 mb-2">
              JSON을 직접 수정한 뒤 &apos;적용&apos; 버튼을 누르면 위 설정에 반영됩니다.
            </p>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full h-64 bg-gray-900 text-green-300 text-[10px] p-3 rounded-lg font-mono resize-y border border-gray-700 focus:outline-none focus:border-yellow-400"
              spellCheck={false}
            />
            {jsonError && (
              <p className="text-red-400 text-[10px] mt-1">{jsonError}</p>
            )}
            <button
              onClick={handleApplyJson}
              className="mt-2 text-[11px] bg-green-700 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              JSON 적용
            </button>
          </Section>
        )}

        {/* ── 8. API 없을 때 안내 ── */}
        <Section title="ℹ️ 8. API 키 설정 안내" defaultOpen={false}>
          <div className="space-y-2 text-[11px]">
            <p className="text-gray-300">
              AI 분석을 사용하려면 <code className="text-yellow-300">.env.local</code> 에
              Anthropic API 키를 설정하세요:
            </p>
            <div className="bg-gray-900 rounded-lg p-3 font-mono text-green-300">
              ANTHROPIC_API_KEY=sk-ant-...
            </div>
            <p className="text-gray-400">
              API 키가 없으면 목 데이터(샘플 메시지)가 사용됩니다. 메시지는
              위 편집기에서 직접 수정 가능합니다.
            </p>
          </div>
        </Section>

        {/* ── Final CTA ── */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleSaveAndGo}
            disabled={!screenshot || messages.length === 0}
            className="w-full py-4 bg-yellow-400 text-gray-900 font-extrabold text-base rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed active:brightness-90 transition-all shadow-lg"
          >
            ✅ 이 설정으로 채팅방 만들기
          </button>
          {(!screenshot || messages.length === 0) && (
            <p className="text-center text-gray-500 text-xs">
              {!screenshot
                ? "스크린샷을 먼저 업로드하세요"
                : "메시지를 추가하거나 AI 분석을 실행하세요"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
