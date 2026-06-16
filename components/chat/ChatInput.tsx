"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEmobinStore } from "@/lib/store";

export default function ChatInput() {
  const [text, setText] = useState("");
  const addMessage = useEmobinStore((s) => s.addMessage);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  useEffect(() => {
    adjustHeight();
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addMessage(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasText = text.trim().length > 0;

  return (
    <div
      className="relative z-10 bg-[#F4F4F4] border-t border-gray-200 px-2 py-2"
      style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-end gap-2">
        {/* + button */}
        <button className="w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-full active:bg-gray-300 transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#888" strokeWidth="1.8" />
            <path d="M12 8v8M8 12h8" stroke="#888" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {/* Text input */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 flex items-end px-3 py-2 min-h-[38px]">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요"
            rows={1}
            className="flex-1 bg-transparent text-[14px] text-gray-900 placeholder-gray-400 resize-none outline-none input-glow leading-[1.4] max-h-[120px] scrollbar-hide"
          />
        </div>

        {/* Right side icons / send button */}
        <div className="flex items-end gap-1 flex-shrink-0">
          <AnimatePresence mode="wait" initial={false}>
            {hasText ? (
              <motion.button
                key="send"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.15, ease: "backOut" }}
                onClick={handleSend}
                className="w-9 h-9 bg-kakao-yellow rounded-full flex items-center justify-center active:brightness-90 transition-all shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
                    stroke="#3C1E1E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.button>
            ) : (
              <motion.div
                key="icons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-1"
              >
                <button className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-300 transition-colors">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#888" strokeWidth="1.8" />
                    <circle cx="8.5" cy="8.5" r="1.5" fill="#888" />
                    <path d="M21 15l-5-5L5 21" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-300 transition-colors">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 18.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13z" stroke="#888" strokeWidth="1.8" />
                    <path d="M12 8v4l2.5 2.5" stroke="#888" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="#888" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
