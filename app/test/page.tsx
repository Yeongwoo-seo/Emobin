"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import UploadZone from "@/components/upload/UploadZone";
import { fileToDataUrl } from "@/lib/imageUtils";
import { useEmobinStore } from "@/lib/store";

export default function UploadPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const setScreenshot = useEmobinStore((s) => s.setScreenshot);
  const router = useRouter();

  const handleFileSelected = useCallback(async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
    setSelectedFile(file);
  }, []);

  const handleStart = async () => {
    if (!selectedFile || !preview) return;
    setScreenshot(preview);
    router.push("/processing");
  };

  return (
    <div className="phone-frame min-h-dvh flex flex-col bg-white">
      {/* Status bar */}
      <div className="h-11 bg-kakao-yellow flex items-center justify-between px-5 pt-1">
        <span className="text-[12px] font-semibold text-kakao-brown">9:41</span>
        <div className="flex items-center gap-1.5">
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <rect x="0" y="3" width="3" height="7" rx="0.5" fill="#3C1E1E" />
            <rect x="4.5" y="2" width="3" height="8" rx="0.5" fill="#3C1E1E" />
            <rect x="9" y="0.5" width="3" height="9.5" rx="0.5" fill="#3C1E1E" />
            <rect x="13.5" y="0" width="2" height="10" rx="0.5" fill="#3C1E1E" opacity="0.3" />
          </svg>
          <svg width="15" height="12" viewBox="0 0 15 12" fill="#3C1E1E">
            <path d="M7.5 3a6.5 6.5 0 016.5 6.5H1A6.5 6.5 0 017.5 3z" />
            <path d="M7.5 0a9.5 9.5 0 019.5 9.5" stroke="#3C1E1E" strokeWidth="1" opacity="0.5" />
          </svg>
          <div className="flex items-center gap-0.5">
            <div className="w-6 h-3 border border-kakao-brown rounded-sm flex items-center px-0.5">
              <div className="w-4 h-1.5 bg-kakao-brown rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-kakao-yellow px-5 pb-5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 pt-2"
        >
          <div className="w-10 h-10 bg-kakao-brown/90 rounded-xl flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
              <path
                d="M18 4C10.268 4 4 9.373 4 16c0 4.347 2.613 8.142 6.556 10.4L9.2 31.2c-.15.367.24.693.582.486L15.6 28.1c.785.1 1.584.15 2.4.15 7.732 0 14-5.373 14-12S25.732 4 18 4z"
                fill="#FEE500"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-kakao-brown leading-tight">이모빈</h1>
            <p className="text-[12px] text-kakao-brown/70">카톡 캡처로 대화방 만들기</p>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-5 pt-6 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-[17px] font-bold text-gray-800 mb-1">
            스크린샷 업로드
          </h2>
          <p className="text-[13px] text-gray-500">
            카카오톡 대화 화면을 캡처하여 업로드하세요
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <UploadZone onFileSelected={handleFileSelected} preview={preview} />
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-50 rounded-2xl p-4 space-y-2"
        >
          <p className="text-[12px] font-semibold text-gray-600">캡처 팁</p>
          {[
            "대화 상대의 프로필 사진이 보이도록 캡처",
            "상단 이름이 잘 보이는 화면",
            "배경 이미지가 있으면 더 멋진 대화방이 만들어져요",
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-kakao-yellow text-[10px] mt-0.5 font-bold">●</span>
              <p className="text-[12px] text-gray-500">{tip}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* CTA Buttons */}
      <div className="px-5 pb-8 pt-4 space-y-3">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: preview ? 1 : 0.4, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleStart}
          disabled={!preview}
          className="w-full h-[52px] bg-kakao-yellow rounded-2xl font-bold text-[16px] text-kakao-brown active:brightness-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          whileTap={preview ? { scale: 0.97 } : undefined}
        >
          대화방 만들기
        </motion.button>

        <motion.a
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          href="/"
          className="w-full h-[44px] border border-gray-300 rounded-2xl font-semibold text-[14px] text-gray-500 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
        >
          <span>🔬</span>
          <span>UI 분석 테스트 페이지</span>
        </motion.a>
      </div>
    </div>
  );
}
