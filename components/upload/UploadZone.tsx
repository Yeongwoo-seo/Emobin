"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  preview: string | null;
}

export default function UploadZone({ onFileSelected, preview }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFileSelected(accepted[0]);
      setIsDragging(false);
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative w-full aspect-[9/16] max-h-[320px] rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden",
        isDragging
          ? "border-kakao-yellow bg-yellow-50 scale-[1.02]"
          : "border-gray-300 bg-gray-50 hover:border-kakao-yellow hover:bg-yellow-50/50"
      )}
    >
      <input {...getInputProps()} />

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <img
              src={preview}
              alt="업로드된 스크린샷"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="bg-black/60 text-white text-sm px-4 py-2 rounded-full">
                다른 사진 선택
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6"
          >
            {/* KakaoTalk icon */}
            <motion.div
              animate={isDragging ? { scale: 1.2, rotate: [0, -5, 5, 0] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-16 h-16 bg-kakao-yellow rounded-2xl flex items-center justify-center shadow-md"
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path
                  d="M18 4C10.268 4 4 9.373 4 16c0 4.347 2.613 8.142 6.556 10.4L9.2 31.2c-.15.367.24.693.582.486L15.6 28.1c.785.1 1.584.15 2.4.15 7.732 0 14-5.373 14-12S25.732 4 18 4z"
                  fill="#3C1E1E"
                />
              </svg>
            </motion.div>

            <div className="text-center">
              <p className="text-gray-700 font-semibold text-base">
                카카오톡 대화 스크린샷
              </p>
              <p className="text-gray-400 text-sm mt-1">
                드래그하거나 탭하여 업로드
              </p>
            </div>

            <div className="flex gap-2 text-xs text-gray-400">
              <span className="bg-gray-200 px-2 py-1 rounded-full">PNG</span>
              <span className="bg-gray-200 px-2 py-1 rounded-full">JPG</span>
              <span className="bg-gray-200 px-2 py-1 rounded-full">WEBP</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
