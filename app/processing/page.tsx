"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEmobinStore } from "@/lib/store";
import {
  dataUrlToBase64,
  getMimeFromDataUrl,
  cropProfileCircle,
  createBlurredBackground,
  resizeImage,
} from "@/lib/imageUtils";
import type { AnalysisResult, ChatMessage } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

const STEPS = [
  "스크린샷 분석 중...",
  "프로필 사진 추출 중...",
  "배경화면 생성 중...",
  "대화방 생성 중...",
  "완료!",
];

export default function ProcessingPage() {
  const router = useRouter();
  const screenshotDataUrl = useEmobinStore((s) => s.screenshotDataUrl);
  const setChatRoomData = useEmobinStore((s) => s.setChatRoomData);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!screenshotDataUrl) {
      router.replace("/");
      return;
    }
    processScreenshot(screenshotDataUrl);
  }, []);

  async function processScreenshot(dataUrl: string) {
    try {
      // Step 0: Analyze
      setStepIndex(0);
      const resized = await resizeImage(dataUrl, 1024, 1024);
      const base64 = dataUrlToBase64(resized);
      const mime = getMimeFromDataUrl(resized);

      const analysisRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: mime }),
      });

      if (!analysisRes.ok) throw new Error("분석 실패");
      const analysis: AnalysisResult = await analysisRes.json();

      await delay(600);

      // Step 1: Profile crop
      setStepIndex(1);
      let profileImageDataUrl: string | null = null;
      if (analysis.profileBounds) {
        try {
          profileImageDataUrl = await cropProfileCircle(dataUrl, analysis.profileBounds, 200);
        } catch {
          profileImageDataUrl = null;
        }
      }
      await delay(700);

      // Step 2: Background
      setStepIndex(2);
      let backgroundDataUrl: string | null = null;
      try {
        backgroundDataUrl = await createBlurredBackground(dataUrl);
      } catch {
        backgroundDataUrl = null;
      }
      await delay(700);

      // Step 3: Build chat room
      setStepIndex(3);
      const messages: ChatMessage[] = (analysis.messages ?? []).map((m) => ({
        ...m,
        id: uuidv4(),
        read: true,
        unreadCount: 0,
      }));
      await delay(800);

      // Step 4: Done
      setStepIndex(4);

      setChatRoomData({
        participantName: analysis.participantName || "상대방",
        profileImageDataUrl,
        backgroundDataUrl,
        backgroundColorHex: analysis.backgroundColorHex || "#B2C7D9",
        messages,
        screenshotDataUrl: dataUrl,
      });

      await delay(600);
      router.push("/chat");
    } catch (err) {
      console.error(err);
      setError("처리 중 오류가 발생했습니다.");
    }
  }

  function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-dvh bg-[#1a1a2e] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background animated circles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 300 + i * 100,
              height: 300 + i * 100,
              border: `1px solid rgba(254, 229, 0, ${0.08 - i * 0.02})`,
              left: "50%",
              top: "50%",
              x: "-50%",
              y: "-50%",
            }}
            animate={{ scale: [1, 1.05, 1], rotate: [0, 180, 360] }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center px-8"
          >
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-white font-semibold text-lg mb-2">{error}</p>
            <button
              onClick={() => router.replace("/")}
              className="mt-4 bg-kakao-yellow text-kakao-brown font-bold px-6 py-3 rounded-2xl"
            >
              다시 시도
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-8 px-10 w-full max-w-sm"
          >
            {/* KakaoTalk logo spinner */}
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 rounded-full border-4 border-kakao-yellow/20 border-t-kakao-yellow"
              />
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={stepIndex === 4 ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                <div className="w-16 h-16 bg-kakao-yellow rounded-2xl flex items-center justify-center shadow-lg">
                  <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
                    <path
                      d="M18 4C10.268 4 4 9.373 4 16c0 4.347 2.613 8.142 6.556 10.4L9.2 31.2c-.15.367.24.693.582.486L15.6 28.1c.785.1 1.584.15 2.4.15 7.732 0 14-5.373 14-12S25.732 4 18 4z"
                      fill="#3C1E1E"
                    />
                  </svg>
                </div>
              </motion.div>
            </div>

            {/* Step text */}
            <div className="text-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={stepIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="text-white text-[18px] font-semibold"
                >
                  {STEPS[stepIndex]}
                </motion.p>
              </AnimatePresence>
              <p className="text-white/40 text-[13px] mt-2">
                잠시만 기다려 주세요
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="h-full bg-kakao-yellow rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>

            {/* Step dots */}
            <div className="flex gap-2">
              {STEPS.map((_, i) => (
                <motion.div
                  key={i}
                  className="rounded-full"
                  animate={{
                    width: i === stepIndex ? 20 : 6,
                    backgroundColor:
                      i <= stepIndex ? "#FEE500" : "rgba(255,255,255,0.2)",
                  }}
                  style={{ height: 6 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
