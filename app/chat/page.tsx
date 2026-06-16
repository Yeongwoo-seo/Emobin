"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEmobinStore } from "@/lib/store";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import ChatInput from "@/components/chat/ChatInput";

export default function ChatPage() {
  const router = useRouter();
  const chatRoomData = useEmobinStore((s) => s.chatRoomData);

  useEffect(() => {
    if (!chatRoomData) {
      router.replace("/");
    }
  }, [chatRoomData]);

  if (!chatRoomData) return null;

  const bg = chatRoomData.backgroundDataUrl
    ? `url(${chatRoomData.backgroundDataUrl})`
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-dvh flex flex-col"
    >
      {/* Status bar */}
      <div
        className="h-11 flex items-center justify-between px-5 pt-1 flex-shrink-0 relative z-20"
        style={{ background: "#F5F5F5" }}
      >
        <span className="text-[12px] font-semibold text-gray-800">
          {new Date().getHours()}:{String(new Date().getMinutes()).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-1.5">
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <rect x="0" y="3" width="3" height="7" rx="0.5" fill="#333" />
            <rect x="4.5" y="2" width="3" height="8" rx="0.5" fill="#333" />
            <rect x="9" y="0.5" width="3" height="9.5" rx="0.5" fill="#333" />
            <rect x="13.5" y="0" width="2" height="10" rx="0.5" fill="#333" opacity="0.3" />
          </svg>
          <div className="flex items-center gap-0.5">
            <div className="w-6 h-3 border border-gray-600 rounded-sm flex items-center px-0.5">
              <div className="w-4 h-1.5 bg-gray-600 rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      <ChatHeader />

      {/* Chat area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="flex-1 flex flex-col overflow-hidden relative"
        style={{
          backgroundImage: bg,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: chatRoomData.backgroundColorHex,
        }}
      >
        {/* Background overlay for readability */}
        {!bg && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: chatRoomData.backgroundColorHex }}
          />
        )}

        <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
          <MessageList />
          <ChatInput />
        </div>
      </motion.div>
    </motion.div>
  );
}
