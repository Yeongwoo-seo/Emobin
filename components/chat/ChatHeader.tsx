"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEmobinStore } from "@/lib/store";

export default function ChatHeader() {
  const router = useRouter();
  const chatRoomData = useEmobinStore((s) => s.chatRoomData);
  const clearAll = useEmobinStore((s) => s.clearAll);

  const handleBack = () => {
    clearAll();
    router.push("/");
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 flex items-center h-[52px] px-2 bg-[#F5F5F5] border-b border-gray-200"
      style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.08)" }}
    >
      {/* Back button */}
      <button
        onClick={handleBack}
        className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/10 transition-colors"
      >
        <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
          <path
            d="M9 1L1 9L9 17"
            stroke="#333"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Center: name */}
      <div className="flex-1 flex items-center justify-center gap-2">
        {chatRoomData?.profileImageDataUrl && (
          <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
            <img
              src={chatRoomData.profileImageDataUrl}
              alt="profile"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <span className="text-[16px] font-bold text-gray-900 truncate max-w-[160px]">
          {chatRoomData?.participantName || "대화방"}
        </span>
        <span className="text-[13px] text-gray-400">1</span>
      </div>

      {/* Right icons */}
      <div className="flex items-center gap-1">
        <button className="w-9 h-9 flex items-center justify-center rounded-full active:bg-black/10 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#555" strokeWidth="2" />
            <path d="M16.5 16.5L21 21" stroke="#555" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-full active:bg-black/10 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.07 2.18 2 2 0 012.03 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
              stroke="#555"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-full active:bg-black/10 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="5" r="1.5" fill="#555" />
            <circle cx="12" cy="12" r="1.5" fill="#555" />
            <circle cx="12" cy="19" r="1.5" fill="#555" />
          </svg>
        </button>
      </div>
    </motion.header>
  );
}
