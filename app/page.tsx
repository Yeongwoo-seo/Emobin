"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { fileToDataUrl, dataUrlToBase64, getMimeFromDataUrl, resizeImage, loadImage } from "@/lib/imageUtils";
import type { AnalysisResult } from "@/lib/types";
import type { BackgroundExtractionResult, Region } from "@/app/api/extract-background/route";

/* ── Canvas: 픽셀 단위 수평 보간으로 배경 복원 (포토샵 AI Fill 방식) ── */
async function removeRegions(
  dataUrl: string,
  regions: Region[],
  bgColor: string
): Promise<string> {
  const img = await loadImage(dataUrl);
  const W = img.naturalWidth;
  const H = img.naturalHeight;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const src = ctx.getImageData(0, 0, W, H);
  const srcData = src.data;

  // 픽셀 단위 마스크 생성
  const mask = new Uint8Array(W * H);
  for (const r of regions) {
    const x0 = Math.max(0, Math.floor(r.x * W));
    const y0 = Math.max(0, Math.floor(r.y * H));
    const x1 = Math.min(W, Math.ceil((r.x + r.w) * W));
    const y1 = Math.min(H, Math.ceil((r.y + r.h) * H));
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        mask[y * W + x] = 1;
      }
    }
  }

  const parsedBg = hexToRgb(bgColor) ?? { r: 178, g: 199, b: 217 };
  const out = new Uint8ClampedArray(srcData);

  // 행별 2-pass: 각 픽셀의 좌/우 비마스크 위치를 미리 계산 후 보간
  for (let y = 0; y < H; y++) {
    const leftOf = new Int32Array(W).fill(-1);
    const rightOf = new Int32Array(W).fill(-1);

    // 왼쪽 pass: 각 x에서 왼쪽으로 가장 가까운 비마스크 픽셀
    let last = -1;
    for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) last = x;
      leftOf[x] = last;
    }

    // 오른쪽 pass: 각 x에서 오른쪽으로 가장 가까운 비마스크 픽셀
    last = -1;
    for (let x = W - 1; x >= 0; x--) {
      if (!mask[y * W + x]) last = x;
      rightOf[x] = last;
    }

    for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) continue;

      const lx = leftOf[x];
      const rx = rightOf[x];
      const i = (y * W + x) * 4;

      if (lx >= 0 && rx >= 0) {
        // 좌우 비마스크 픽셀 사이를 선형 보간
        const t = (x - lx) / (rx - lx);
        const li = (y * W + lx) * 4;
        const ri = (y * W + rx) * 4;
        out[i]     = Math.round(srcData[li]     + t * (srcData[ri]     - srcData[li]));
        out[i + 1] = Math.round(srcData[li + 1] + t * (srcData[ri + 1] - srcData[li + 1]));
        out[i + 2] = Math.round(srcData[li + 2] + t * (srcData[ri + 2] - srcData[li + 2]));
        out[i + 3] = 255;
      } else if (lx >= 0) {
        const li = (y * W + lx) * 4;
        out[i] = srcData[li]; out[i+1] = srcData[li+1]; out[i+2] = srcData[li+2]; out[i+3] = 255;
      } else if (rx >= 0) {
        const ri = (y * W + rx) * 4;
        out[i] = srcData[ri]; out[i+1] = srcData[ri+1]; out[i+2] = srcData[ri+2]; out[i+3] = 255;
      } else {
        out[i] = parsedBg.r; out[i+1] = parsedBg.g; out[i+2] = parsedBg.b; out[i+3] = 255;
      }
    }
  }

  ctx.putImageData(new ImageData(out, W, H), 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : null;
}

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

/* ── SENDER LABEL ── */
const SENDER_COLORS = {
  me: "bg-[#FFEB33] text-gray-900",
  other: "bg-white text-gray-900 border border-gray-200",
};

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

  /* Test 2 state */
  const [t2Status, setT2Status] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [t2Log, setT2Log] = useState<string[]>([]);
  const [t2BgResult, setT2BgResult] = useState<BackgroundExtractionResult | null>(null);
  const [t2ProcessedImg, setT2ProcessedImg] = useState<string | null>(null);

  /* Upload */
  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return;
    const url = await fileToDataUrl(files[0]);
    setScreenshot(url);
    setT1Status("idle"); setT1Result(null); setT1Log([]);
    setT2Status("idle"); setT2BgResult(null); setT2ProcessedImg(null); setT2Log([]);
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

      // Check for API-level errors
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

  /* ── Test 2: Background extraction ── */
  async function runTest2() {
    if (!screenshot) return;
    setT2Status("loading");
    setT2Log(["이미지 리사이즈 중..."]);
    setT2BgResult(null);
    setT2ProcessedImg(null);
    try {
      const resized = await resizeImage(screenshot, 1280, 1280);
      const b64 = dataUrlToBase64(resized);
      const mime = getMimeFromDataUrl(resized);

      setT2Log((p) => [...p, "AI: 말풍선/UI 영역 탐지 중..."]);
      const res = await fetch("/api/extract-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: b64, mimeType: mime }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: BackgroundExtractionResult = await res.json();
      setT2BgResult(data);

      const bubbleCount = data.regions.filter((r) =>
        r.type.startsWith("bubble")
      ).length;
      setT2Log((p) => [
        ...p,
        `AI 완료: ${data.regions.length}개 영역 탐지 (말풍선 ${bubbleCount}개)`,
      ]);

      if (data.inpaintedBackgroundBase64) {
        // AI가 생성한 배경 이미지 사용
        setT2ProcessedImg(`data:image/png;base64,${data.inpaintedBackgroundBase64}`);
        setT2Log((p) => [...p, "✅ AI 인페인팅 완료 (Gemini 이미지 생성)"]);
      } else {
        // Fallback: 클라이언트 canvas 픽셀 보간
        setT2Log((p) => [...p, "Canvas 픽셀 보간으로 배경 복원 중..."]);
        const processed = await removeRegions(screenshot, data.regions, data.backgroundColorHex);
        setT2ProcessedImg(processed);
        setT2Log((p) => [...p, "✅ 배경 추출 완료 (픽셀 보간)"]);
      }
      setT2Status("ok");
    } catch (e) {
      setT2Log((p) => [...p, `❌ 오류: ${e}`]);
      setT2Status("error");
    }
  }

  /* ── Helpers ── */
  const regionTypeColor: Record<string, string> = {
    statusbar: "border-purple-400 bg-purple-400/20",
    header: "border-blue-400 bg-blue-400/20",
    profile: "border-orange-400 bg-orange-400/20",
    bubble_other: "border-white bg-white/20",
    bubble_me: "border-yellow-400 bg-yellow-400/20",
    date_divider: "border-gray-400 bg-gray-400/20",
    inputbar: "border-green-400 bg-green-400/20",
  };

  const regionTypeLabel: Record<string, string> = {
    statusbar: "상태바",
    header: "헤더",
    profile: "프로필",
    bubble_other: "상대방 말풍선",
    bubble_me: "내 말풍선",
    date_divider: "날짜",
    inputbar: "입력창",
  };

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
            ① 메시지 추출 &nbsp;·&nbsp; ② 배경화면 추출
          </p>
        </div>
        <a href="/test" className="text-gray-700 text-xs border border-gray-600/40 px-3 py-1.5 rounded-full">
          홈
        </a>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-5">

        {/* ═══ API KEY STATUS BANNER ═══ */}
        {apiKeyStatus === "missing" && (
          <div className="bg-red-900/40 border border-red-500/50 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🔑</span>
              <div>
                <p className="text-red-300 font-bold text-sm mb-1">
                  GEMINI_API_KEY 미설정 → 지금 샘플 데이터만 반환됩니다
                </p>
                <p className="text-red-400/80 text-[11px] mb-3 leading-relaxed">
                  실제 스크린샷 분석을 하려면 API 키를 설정해야 합니다.
                </p>
                <div className="space-y-2">
                  <div className="bg-black/30 rounded-xl p-3 space-y-1.5">
                    <p className="text-[11px] font-bold text-gray-300">① API 키 발급</p>
                    <p className="text-[11px] text-gray-400">
                      <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline"
                      >
                        aistudio.google.com/apikey
                      </a>{" "}
                      → API Keys → Create Key → <code className="text-yellow-300">sk-ant-...</code> 복사
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 space-y-1.5">
                    <p className="text-[11px] font-bold text-gray-300">② 로컬 개발 시</p>
                    <code className="block text-[11px] text-green-300 font-mono bg-black/30 px-2 py-1 rounded">
                      GEMINI_API_KEY=AIza...
                    </code>
                    <p className="text-[11px] text-gray-500">
                      → <code>.env.local</code> 파일에 위 내용 추가 후 서버 재시작
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 space-y-1.5">
                    <p className="text-[11px] font-bold text-gray-300">③ Vercel 배포 시</p>
                    <p className="text-[11px] text-gray-400">
                      Vercel 대시보드 → 프로젝트 → Settings → Environment Variables → 추가 → Redeploy
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
            <p className="text-green-300 text-[12px] font-semibold">
              GEMINI_API_KEY 설정됨 — Gemini 실제 분석이 실행됩니다
            </p>
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

            {/* Log */}
            {t1Log.length > 0 && (
              <div className="bg-black/30 rounded-xl p-3 space-y-1">
                {t1Log.map((l, i) => (
                  <p key={i} className="text-[11px] font-mono text-gray-300">{l}</p>
                ))}
              </div>
            )}

            {/* Result */}
            {t1Result && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Screenshot side */}
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">
                    원본
                  </p>
                  {screenshot && (
                    <img
                      src={screenshot}
                      alt="original"
                      className="w-full rounded-xl border border-gray-700"
                    />
                  )}
                </div>

                {/* Extracted messages */}
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">
                    추출된 메시지 ({t1Result.messages?.length ?? 0}개)
                  </p>

                  <div className="mb-3 flex flex-wrap gap-2 text-[10px]">
                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded">
                      상대방: <strong className="text-white">{t1Result.participantName}</strong>
                    </span>
                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded">
                      배경색:{" "}
                      <span
                        className="inline-block w-3 h-3 rounded-sm align-middle ml-1 border border-gray-600"
                        style={{ background: t1Result.backgroundColorHex }}
                      />
                      <strong className="text-white ml-1">{t1Result.backgroundColorHex}</strong>
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
                        <span className="text-[10px] text-gray-600 flex-shrink-0 mt-0.5 w-4 text-right">
                          {i + 1}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${SENDER_COLORS[msg.sender]}`}
                        >
                          {msg.sender === "me" ? "나" : "상대"}
                        </span>
                        <p className="text-[12px] text-white flex-1 leading-snug">{msg.text}</p>
                        <span className="text-[10px] text-gray-500 flex-shrink-0 whitespace-nowrap">
                          {msg.time}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Raw JSON toggle */}
                  <details className="mt-3">
                    <summary className="text-[10px] text-gray-500 cursor-pointer hover:text-gray-300">
                      Raw JSON 보기
                    </summary>
                    <pre className="mt-2 bg-black/40 text-green-300 text-[9px] p-3 rounded-xl overflow-auto max-h-48 font-mono">
                      {JSON.stringify(t1Result, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══ TEST 2: 배경 추출 ═══ */}
        <section className="bg-[#1E293B] rounded-2xl overflow-hidden border border-gray-700/50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
            <div className="flex items-center gap-2">
              <span className="text-lg">🖼️</span>
              <div>
                <span className="font-bold text-sm">TEST 2 · 배경화면 추출</span>
                <p className="text-gray-500 text-[10px] mt-0.5">
                  AI가 말풍선/프로필/UI 위치를 탐지 → Canvas로 제거 → 배경만 남김
                </p>
              </div>
            </div>
            <Badge status={t2Status} />
          </div>

          <div className="p-4 space-y-4">
            <button
              onClick={runTest2}
              disabled={!screenshot || t2Status === "loading"}
              className="w-full py-2.5 bg-blue-500 text-white font-bold rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed active:brightness-90 transition-all"
            >
              {t2Status === "loading" ? "⏳ 처리 중..." : "🎨 배경 추출 시작"}
            </button>

            {/* Log */}
            {t2Log.length > 0 && (
              <div className="bg-black/30 rounded-xl p-3 space-y-1">
                {t2Log.map((l, i) => (
                  <p key={i} className="text-[11px] font-mono text-gray-300">{l}</p>
                ))}
              </div>
            )}

            {/* Regions legend */}
            {t2BgResult && (
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">
                  탐지된 영역 ({t2BgResult.regions.length}개)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {t2BgResult.regions.map((r, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg border ${regionTypeColor[r.type] ?? "border-gray-500 bg-gray-500/20"}`}
                    >
                      <span className="font-semibold">
                        {regionTypeLabel[r.type] ?? r.type}
                      </span>
                      {r.label && (
                        <span className="text-gray-300 max-w-[80px] truncate">
                          "{r.label}"
                        </span>
                      )}
                      <span className="text-gray-500">
                        ({(r.w * 100).toFixed(0)}%×{(r.h * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Before / After */}
            {(screenshot && (t2BgResult || t2ProcessedImg)) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Before: original with overlays */}
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">
                    원본 + 탐지 영역
                  </p>
                  <div
                    className="relative rounded-xl overflow-hidden border border-gray-700"
                    style={{ aspectRatio: `${imgSize.w}/${imgSize.h}` }}
                  >
                    <img
                      src={screenshot}
                      alt="original"
                      className="w-full h-full object-contain"
                    />
                    {/* Overlay boxes */}
                    {t2BgResult?.regions.map((r, i) => (
                      <div
                        key={i}
                        className={`absolute border ${regionTypeColor[r.type] ?? "border-gray-400 bg-gray-400/20"}`}
                        style={{
                          left: `${r.x * 100}%`,
                          top: `${r.y * 100}%`,
                          width: `${r.w * 100}%`,
                          height: `${r.h * 100}%`,
                        }}
                      >
                        <span
                          className="absolute top-0 left-0 text-[7px] font-bold text-white bg-black/50 px-0.5 leading-tight"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {regionTypeLabel[r.type] ?? r.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* After: processed image */}
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">
                    추출된 배경화면
                  </p>
                  {t2ProcessedImg ? (
                    <>
                      <img
                        src={t2ProcessedImg}
                        alt="background"
                        className="w-full rounded-xl border border-gray-700"
                      />
                      <a
                        href={t2ProcessedImg}
                        download="kakao-background.jpg"
                        className="mt-2 block text-center text-[11px] text-blue-400 border border-blue-400/30 rounded-lg py-1.5 hover:bg-blue-400/10 transition-colors"
                      >
                        ⬇ 배경 이미지 다운로드
                      </a>
                    </>
                  ) : (
                    <div className="aspect-video rounded-xl border border-gray-700 bg-gray-800/50 flex items-center justify-center">
                      <p className="text-gray-500 text-sm">처리 중...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info box */}
            <div className="bg-black/20 rounded-xl p-3 border border-gray-700/40">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                <strong className="text-gray-300">처리 방식:</strong> AI(Gemini)가 모든 말풍선, 프로필, 헤더, 입력창 위치를 px 좌표로 계산 →
                Canvas API가 각 영역을 주변 픽셀 색상으로 채워 배경화면 복원 →
                엣지 블러로 자연스럽게 블렌딩
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
