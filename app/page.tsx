"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { fileToDataUrl, dataUrlToBase64, getMimeFromDataUrl, resizeImage } from "@/lib/imageUtils";
import type { AnalysisResult } from "@/lib/types";
import MessageBubble from "@/components/chat/MessageBubble";

/* ── Status Badge ── */
function Badge({ status }: { status: "idle" | "loading" | "ok" | "error" }) {
  const map = {
    idle: "bg-gray-700 text-gray-400",
    loading: "bg-yellow-900/50 text-yellow-300 animate-pulse",
    ok: "bg-green-900/50 text-green-300",
    error: "bg-red-900/50 text-red-300",
  };
  const labels = { idle: "대기중", loading: "처리중...", ok: "완료", error: "실패" };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

const SENDER_COLORS = {
  me: "bg-[#FFEB33] text-gray-900",
  other: "bg-white text-gray-900 border border-gray-200",
};

/* ── 메시지 그룹화 (카카오톡 연속 메시지 처리) ── */
function groupMessages(messages: AnalysisResult["messages"]) {
  return messages.map((msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const isFirst = !prev || prev.sender !== msg.sender;
    const isLast = !next || next.sender !== msg.sender;
    return { msg, isFirst, isLast };
  });
}

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
export default function TestPage() {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState({ w: 1, h: 1 });
  const [apiKeyStatus, setApiKeyStatus] = useState<"checking" | "ok" | "missing">("checking");

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

  /* Test 1 state */
  const [t1Status, setT1Status] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [t1Log, setT1Log] = useState<string[]>([]);
  const [t1Result, setT1Result] = useState<AnalysisResult | null>(null);

  /* Test 2 state: 배경색 */
  const [bgColor, setBgColor] = useState("#B2C7D9");

  /* Sync bgColor with detected color from TEST 1 */
  useEffect(() => {
    if (t1Result?.backgroundColorHex) {
      setBgColor(t1Result.backgroundColorHex);
    }
  }, [t1Result?.backgroundColorHex]);

  /* Upload */
  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return;
    const url = await fileToDataUrl(files[0]);
    setScreenshot(url);
    setT1Status("idle"); setT1Result(null); setT1Log([]);
    setBgColor("#B2C7D9");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  /* ── Test 1: Message extraction ── */
  async function runTest1() {
    if (!screenshot) return;
    setT1Status("loading");
    setT1Log(["이미지 리사이즈 중..."]);
    setT1Result(null);
    try {
      const resized = await resizeImage(screenshot, 1280, 1280);
      const b64 = dataUrlToBase64(resized);
      const mime = getMimeFromDataUrl(resized);

      setT1Log((p) => [...p, "Gemini API 호출 중..."]);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: b64, mimeType: mime }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        const errMsg = data.error || `HTTP ${res.status}`;
        const detail = data.detail ? ` (${data.detail})` : "";
        const raw = data.rawResponse ? `\n응답: ${data.rawResponse}` : "";
        setT1Log((p) => [...p, `❌ 실패: ${errMsg}${detail}${raw}`]);
        setT1Status("error");
        return;
      }

      const source = data._source === "mock_no_key"
        ? "⚠️ 목 데이터 (API 키 없음)"
        : data._source === "gemini"
        ? "✅ Gemini 실제 분석"
        : "⚠️ 알 수 없는 소스";

      setT1Result(data as AnalysisResult);
      setT1Log((p) => [
        ...p,
        `${source}: 메시지 ${data.messages?.length ?? 0}개, 이름 "${data.participantName}"`,
      ]);
      setT1Status("ok");
    } catch (e) {
      setT1Log((p) => [...p, `❌ 오류: ${e}`]);
      setT1Status("error");
    }
  }

  /* ─────────────────────── RENDER ─────────────────────── */
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Top bar */}
      <div className="bg-[#FFEB33] px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 font-black text-lg leading-tight tracking-tight">
            이모빈 핵심 기능 테스트
          </h1>
          <p className="text-gray-700 text-[11px] mt-0.5">
            ① 메시지 추출 &nbsp;·&nbsp; ② 배경색 설정 &nbsp;·&nbsp; ③ UI 구현 비교
          </p>
        </div>
        <a href="/test" className="text-gray-700 text-xs border border-gray-600/40 px-3 py-1.5 rounded-full">
          홈
        </a>
      </div>

      <div className="p-4 max-w-5xl mx-auto space-y-5">

        {/* ═══ API KEY STATUS ═══ */}
        {apiKeyStatus === "missing" && (
          <div className="bg-red-900/40 border border-red-500/50 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🔑</span>
              <div>
                <p className="text-red-300 font-bold text-sm mb-1">
                  GEMINI_API_KEY 미설정 → 샘플 데이터만 반환
                </p>
                <div className="space-y-2 mt-2">
                  <div className="bg-black/30 rounded-xl p-3">
                    <p className="text-[11px] text-gray-400">
                      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                        aistudio.google.com/apikey
                      </a>
                      {" "}→ Create Key → <code className="text-green-300">.env.local</code>에 <code className="text-yellow-300">GEMINI_API_KEY=AIza...</code> 추가
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {apiKeyStatus === "ok" && (
          <div className="bg-green-900/30 border border-green-500/40 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span className="text-green-400">✅</span>
            <p className="text-green-300 text-[12px] font-semibold">GEMINI_API_KEY 설정됨</p>
          </div>
        )}

        {/* ═══ UPLOAD ═══ */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragActive
              ? "border-yellow-400 bg-yellow-400/10"
              : screenshot
              ? "border-green-500/50 bg-green-900/10"
              : "border-gray-700 hover:border-gray-500"
          }`}
        >
          <input {...getInputProps()} />
          {screenshot ? (
            <div className="flex items-center justify-center gap-3">
              <img
                src={screenshot}
                alt="preview"
                className="w-12 h-12 object-cover rounded-lg border border-gray-600"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
                }}
              />
              <div className="text-left">
                <p className="text-green-400 text-sm font-semibold">✓ 스크린샷 로드됨</p>
                <p className="text-gray-500 text-xs">
                  {imgSize.w} × {imgSize.h}px · 클릭해서 교체
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-300 font-semibold">카카오톡 스크린샷 업로드</p>
              <p className="text-gray-600 text-sm mt-1">드래그 앤 드롭 또는 클릭</p>
            </div>
          )}
        </div>

        {/* ═══ TEST 1: 메시지 추출 ═══ */}
        <section className="bg-[#1E293B] rounded-2xl overflow-hidden border border-gray-700/50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <div>
                <span className="font-bold text-sm">TEST 1 · 메시지 추출</span>
                <p className="text-gray-500 text-[10px] mt-0.5">
                  AI가 말풍선을 읽어 발신자(나/상대방)와 텍스트를 구분하는지 확인
                </p>
              </div>
            </div>
            <Badge status={t1Status} />
          </div>

          <div className="p-4 space-y-4">
            <button
              onClick={runTest1}
              disabled={!screenshot || t1Status === "loading"}
              className="w-full py-2.5 bg-[#FFEB33] text-gray-900 font-bold rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed active:brightness-90 transition-all"
            >
              {t1Status === "loading" ? "⏳ 분석 중..." : "🤖 메시지 추출 시작"}
            </button>

            {t1Log.length > 0 && (
              <div className="bg-black/30 rounded-xl p-3 space-y-1">
                {t1Log.map((l, i) => (
                  <p key={i} className="text-[11px] font-mono text-gray-300">{l}</p>
                ))}
              </div>
            )}

            {t1Result && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">원본</p>
                  {screenshot && (
                    <img src={screenshot} alt="original" className="w-full rounded-xl border border-gray-700" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">
                    추출된 메시지 ({t1Result.messages?.length ?? 0}개)
                  </p>
                  <div className="mb-3 flex flex-wrap gap-2 text-[10px]">
                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded">
                      상대방: <strong className="text-white">{t1Result.participantName}</strong>
                    </span>
                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded flex items-center gap-1">
                      배경색:
                      <span className="inline-block w-3 h-3 rounded-sm border border-gray-600 ml-1" style={{ background: t1Result.backgroundColorHex }} />
                      <strong className="text-white">{t1Result.backgroundColorHex}</strong>
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                    {(t1Result.messages ?? []).map((msg, i) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 items-start p-2 rounded-xl border ${
                          msg.sender === "me"
                            ? "border-yellow-800/50 bg-yellow-900/20"
                            : "border-gray-700/50 bg-gray-800/50"
                        }`}
                      >
                        <span className="text-[10px] text-gray-600 flex-shrink-0 mt-0.5 w-4 text-right">{i + 1}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${SENDER_COLORS[msg.sender]}`}>
                          {msg.sender === "me" ? "나" : "상대"}
                        </span>
                        <p className="text-[12px] text-white flex-1 leading-snug">{msg.text}</p>
                        <span className="text-[10px] text-gray-500 flex-shrink-0 whitespace-nowrap">{msg.time}</span>
                      </div>
                    ))}
                  </div>
                  <details className="mt-3">
                    <summary className="text-[10px] text-gray-500 cursor-pointer hover:text-gray-300">Raw JSON</summary>
                    <pre className="mt-2 bg-black/40 text-green-300 text-[9px] p-3 rounded-xl overflow-auto max-h-48 font-mono">
                      {JSON.stringify(t1Result, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══ TEST 2: 배경색 설정 ═══ */}
        <section className="bg-[#1E293B] rounded-2xl overflow-hidden border border-gray-700/50">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700/50">
            <span className="text-lg">🎨</span>
            <div>
              <span className="font-bold text-sm">TEST 2 · 배경색 설정</span>
              <p className="text-gray-500 text-[10px] mt-0.5">
                AI 추출 배경색 확인 · 직접 수정 가능 · TEST 3 채팅 UI에 반영
              </p>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl border-2 border-gray-600 flex-shrink-0 shadow-lg"
                style={{ background: bgColor }}
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <label className="text-[11px] text-gray-400 w-16 flex-shrink-0">색상 선택</label>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer border border-gray-600 bg-transparent"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setBgColor(v);
                    }}
                    className="flex-1 bg-gray-800 text-white text-[13px] font-mono px-3 py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:border-yellow-400"
                    maxLength={7}
                    placeholder="#B2C7D9"
                  />
                </div>
                {t1Result?.backgroundColorHex && t1Result.backgroundColorHex !== bgColor && (
                  <button
                    onClick={() => setBgColor(t1Result!.backgroundColorHex)}
                    className="text-[11px] text-yellow-400 hover:text-yellow-300"
                  >
                    ↩ AI 추출값으로 되돌리기 ({t1Result.backgroundColorHex})
                  </button>
                )}
                <div className="flex gap-2 flex-wrap">
                  {["#B2C7D9", "#E8F4E8", "#F5E6D3", "#E8E8F0", "#F0F0F0", "#2C2C2E"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setBgColor(c)}
                      className="w-7 h-7 rounded-lg border-2 transition-all"
                      style={{
                        background: c,
                        borderColor: bgColor === c ? "#FFEB33" : "transparent",
                      }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ TEST 3: 실제 카톡 UI 구현 비교 ═══ */}
        <section className="bg-[#1E293B] rounded-2xl overflow-hidden border border-gray-700/50">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700/50">
            <span className="text-lg">📱</span>
            <div>
              <span className="font-bold text-sm">TEST 3 · 실제 카톡 UI 구현 비교</span>
              <p className="text-gray-500 text-[10px] mt-0.5">
                좌: 원본 스크린샷 · 우: 추출 데이터로 구현한 카카오톡 UI
              </p>
            </div>
          </div>

          <div className="p-4">
            {!t1Result ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                TEST 1을 먼저 실행해주세요
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">

                {/* ── 좌: 원본 스크린샷 ── */}
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">
                    원본 스크린샷
                  </p>
                  {screenshot && (
                    <img
                      src={screenshot}
                      alt="original"
                      className="w-full rounded-2xl border border-gray-700 shadow-lg"
                    />
                  )}
                </div>

                {/* ── 우: 구현된 카카오톡 UI ── */}
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">
                    구현 UI
                  </p>
                  <div
                    className="rounded-2xl overflow-hidden border border-gray-700 shadow-lg flex flex-col"
                    style={{ aspectRatio: `${imgSize.w}/${imgSize.h}` }}
                  >
                    {/* Status bar */}
                    <div className="flex-shrink-0 h-[5.5%] bg-[#F5F5F5] flex items-center justify-between px-3">
                      <span className="text-[9px] font-semibold text-gray-700">10:52</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-gray-500">●●●</span>
                      </div>
                    </div>

                    {/* Header */}
                    <div className="flex-shrink-0 h-[8%] bg-[#F5F5F5] border-b border-gray-200 flex items-center px-2 gap-1">
                      <span className="text-[10px] text-gray-500">‹ 1</span>
                      <span className="flex-1 text-center text-[11px] font-bold text-gray-800 truncate">
                        {t1Result.participantName}
                      </span>
                      <span className="text-[10px] text-gray-400">🔍 📞 ☰</span>
                    </div>

                    {/* Message area */}
                    <div
                      className="flex-1 overflow-y-auto px-2 py-2 space-y-0 min-h-0"
                      style={{ background: bgColor }}
                    >
                      {groupMessages(t1Result.messages ?? []).map(({ msg, isFirst, isLast }) => (
                        <MessageBubble
                          key={msg.id}
                          message={{ ...msg, read: true }}
                          profileImageDataUrl={null}
                          participantName={t1Result!.participantName}
                          showProfile={msg.sender === "other"}
                          showName={isFirst && msg.sender === "other"}
                          isFirst={isFirst}
                          isLast={isLast}
                        />
                      ))}
                    </div>

                    {/* Input bar */}
                    <div className="flex-shrink-0 h-[10%] bg-white border-t border-gray-200 flex items-center px-2 gap-1">
                      <span className="text-[12px] text-gray-400">＋</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-[60%] flex items-center px-2">
                        <span className="text-[9px] text-gray-400">메시지 입력</span>
                      </div>
                      <span className="text-[10px] text-gray-400">😊 # 🎤</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
