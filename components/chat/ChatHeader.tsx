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
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex-shrink-0 bg-[#F5F5F5] border-b border-[#E0E0E0] flex items-center px-1 h-[52px]"
      style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.06)" }}
    >
      {/* Back button */}
      <button
        onClick={handleBack}
        className="w-11 h-11 flex items-center justify-center rounded-full active:bg-black/8 transition-colors flex-shrink-0"
      >
        <svg width="9" height="16" viewBox="0 0 9 16" fill="none">
          <path
            d="M8 1L1.5 8L8 15"
            stroke="#1A1A1A"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Center: name + count */}
      <div className="flex-1 flex items-center justify-center min-w-0 px-1">
        <div className="flex items-center gap-[6px] min-w-0">
          {chatRoomData?.profileImageDataUrl ? (
            <div className="w-[30px] h-[30px] rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
              <img
                src={chatRoomData.profileImageDataUrl}
                alt="profile"
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}
          <span
            className="text-[17px] font-bold text-[#1A1A1A] truncate max-w-[180px] leading-none"
            style={{ letterSpacing: "-0.3px" }}
          >
            {chatRoomData?.participantName || "대화방"}
          </span>
          <span className="text-[14px] font-normal text-[#9E9E9E] flex-shrink-0 leading-none mt-px">
            1
          </span>
        </div>
      </div>

      {/* Right action buttons */}
      <div className="flex items-center flex-shrink-0">
        {/* Search */}
        <button className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/8 transition-colors">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7.5" stroke="#3C3C3C" strokeWidth="1.8" />
            <path
              d="M16.5 16.5L21 21"
              stroke="#3C3C3C"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Call */}
        <button className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/8 transition-colors">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path
              d="M21.97 18.33c.06.5-.09 1.02-.47 1.4l-1.43 1.43c-.2.21-.46.38-.75.48-.29.1-.6.13-.9.09-1.63-.22-3.19-.83-4.58-1.8C12.6 18.99 11.37 17.86 10.4 16.57 9.44 15.3 8.82 13.83 8.59 12.28c-.04-.3-.01-.61.08-.9.1-.29.26-.55.47-.76L10.57 9.19c.51-.51 1.34-.51 1.85 0l1.87 1.87c.25.25.39.59.37.94-.02.35-.18.68-.43.93L13.07 14.06c.63 1.16 1.49 2.19 2.55 3.04l1.22-1.12c.25-.23.58-.37.93-.39.35-.02.7.1.96.36l1.87 1.87c.21.21.35.48.37.77z"
              fill="#3C3C3C"
            />
          </svg>
        </button>

        {/* More */}
        <button className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/8 transition-colors">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <circle cx="4" cy="12" r="1.8" fill="#3C3C3C" />
            <circle cx="12" cy="12" r="1.8" fill="#3C3C3C" />
            <circle cx="20" cy="12" r="1.8" fill="#3C3C3C" />
          </svg>
        </button>
      </div>
    </motion.header>
  );
}
