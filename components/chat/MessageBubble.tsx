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
  isFirst: boolean;   // first in group (affects top border radius)
  isLast: boolean;    // last in group (affects bottom border radius + profile show)
  isNew?: boolean;
}

export default function MessageBubble({
  message,
  profileImageDataUrl,
  participantName,
  showProfile,
  showName,
  isFirst,
  isLast,
  isNew = false,
}: MessageBubbleProps) {
  const isMe = message.sender === "me";

  // KakaoTalk bubble border-radius logic
  // For consecutive messages from same sender, flatten the inner corners
  const getBubbleRadius = () => {
    if (isMe) {
      // Sent: right side
      const topRight = isFirst ? 18 : 4;
      const bottomRight = isLast ? 4 : 4;
      return `18px ${topRight}px ${bottomRight}px 18px`;
    } else {
      // Received: left side
      const topLeft = isFirst ? 18 : 4;
      const bottomLeft = isLast ? 4 : 4;
      return `${topLeft}px 18px 18px ${bottomLeft}px`;
    }
  };

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 12, scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.34, 1.2, 0.64, 1] }}
      className={cn(
        "flex items-end gap-2",
        isMe ? "flex-row-reverse" : "flex-row",
        isLast ? "mb-2" : "mb-0.5"
      )}
    >
      {/* Profile picture column (other side only) */}
      {!isMe && (
        <div className="w-[38px] flex-shrink-0 self-end">
          {isLast && (
            <div className="w-[38px] h-[38px] rounded-full overflow-hidden bg-gray-300">
              {profileImageDataUrl ? (
                <img
                  src={profileImageDataUrl}
                  alt={participantName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Message column */}
      <div
        className={cn(
          "flex flex-col",
          isMe ? "items-end" : "items-start",
          "max-w-[72%]"
        )}
      >
        {/* Name label (other, first in group only) */}
        {!isMe && isFirst && (
          <span className="text-[12px] text-gray-700 font-medium mb-[3px] ml-0.5">
            {participantName}
          </span>
        )}

        {/* Bubble + meta row */}
        <div
          className={cn(
            "flex items-end gap-[5px]",
            isMe ? "flex-row-reverse" : "flex-row"
          )}
        >
          {/* Bubble */}
          <div
            className={cn(
              "px-[12px] py-[8px] text-[14px] leading-[1.45] break-words max-w-full",
              isMe ? "text-[#1a1a1a]" : "text-[#1a1a1a] shadow-sm"
            )}
            style={{
              background: isMe ? "#FFEB33" : "#FFFFFF",
              borderRadius: getBubbleRadius(),
            }}
          >
            {message.text}
          </div>

          {/* Time + unread count (only on last message in group) */}
          {isLast && (
            <div
              className={cn(
                "flex flex-col pb-[2px] flex-shrink-0",
                isMe ? "items-end" : "items-start"
              )}
            >
              {(message.unreadCount ?? 0) > 0 && (
                <span className="text-[11px] text-[#FFCA00] font-bold leading-none mb-[1px]">
                  {message.unreadCount}
                </span>
              )}
              <span className="text-[11px] text-[#8E8E8E] leading-none whitespace-nowrap">
                {message.time}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Spacer for sent messages (mirrors profile area) */}
      {isMe && <div className="w-[38px] flex-shrink-0" />}
    </motion.div>
  );
}
