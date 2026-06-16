"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { ChatMessage } from "@/lib/types";

interface MessageBubbleProps {
  message: ChatMessage;
  profileImageDataUrl: string | null;
  participantName: string;
  showProfile: boolean;
  showName: boolean;
  isNew?: boolean;
}

export default function MessageBubble({
  message,
  profileImageDataUrl,
  participantName,
  showProfile,
  showName,
  isNew = false,
}: MessageBubbleProps) {
  const isMe = message.sender === "me";

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 10, scale: 0.96 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.25,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      className={cn(
        "flex items-end gap-2 mb-1",
        isMe ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Profile picture (other only) */}
      {!isMe && (
        <div className="w-9 h-9 flex-shrink-0 self-end mb-1">
          {showProfile && (
            <motion.div
              initial={isNew ? { scale: 0.8, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              className="w-9 h-9 rounded-full overflow-hidden border border-gray-200"
            >
              {profileImageDataUrl ? (
                <img
                  src={profileImageDataUrl}
                  alt={participantName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      <div
        className={cn(
          "flex flex-col max-w-[70%]",
          isMe ? "items-end" : "items-start"
        )}
      >
        {/* Name (other, first in group only) */}
        {!isMe && showName && (
          <span className="text-[12px] text-gray-600 font-medium mb-1 ml-1">
            {participantName}
          </span>
        )}

        <div
          className={cn(
            "flex items-end gap-1",
            isMe ? "flex-row-reverse" : "flex-row"
          )}
        >
          {/* Bubble */}
          <div
            className={cn(
              "px-3 py-2 text-[14px] leading-[1.4] break-words max-w-full",
              isMe ? "bubble-sent text-gray-900" : "bubble-received text-gray-900 shadow-sm"
            )}
          >
            {message.text}
          </div>

          {/* Time + unread count */}
          <div
            className={cn(
              "flex flex-col gap-0.5 pb-1 flex-shrink-0",
              isMe ? "items-end" : "items-start"
            )}
          >
            {message.unreadCount && message.unreadCount > 0 ? (
              <span className="text-[11px] text-kakao-yellow font-bold leading-none">
                {message.unreadCount}
              </span>
            ) : null}
            <span className="text-[10px] text-gray-400 leading-none whitespace-nowrap">
              {message.time}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
