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
  isFirst: boolean;
  isLast: boolean;
  isNew?: boolean;
}

// Tail dimensions (꼬리)
const TAIL_W = 8;   // how far the tail protrudes
const TAIL_H = 16;  // total height of tail region
const F = 20;       // free corner radius
const C = 5;        // connected corner radius (within a group)

function getBubbleRadius(isMe: boolean, isFirst: boolean, isLast: boolean) {
  if (isMe) {
    // Right-side: tail at top-right when first → TR = 0
    const TR = isFirst ? 0 : C;
    const BR = isLast ? F : C;
    return `${F}px ${TR}px ${BR}px ${F}px`;
  } else {
    // Left-side: tail at top-left when first → TL = 0
    const TL = isFirst ? 0 : C;
    const BL = isLast ? F : C;
    return `${TL}px ${F}px ${F}px ${BL}px`;
  }
}

// SVG tail for received (points left)
function ReceivedTail() {
  return (
    <svg
      width={TAIL_W}
      height={TAIL_H}
      viewBox={`0 0 ${TAIL_W} ${TAIL_H}`}
      style={{ flexShrink: 0, display: "block" }}
    >
      {/* Fill */}
      <path d={`M ${TAIL_W} 0 L 0 ${TAIL_H / 2} L ${TAIL_W} ${TAIL_H} Z`} fill="#FFFFFF" />
      {/* Outer edge stroke only (not the right closing edge) */}
      <path
        d={`M ${TAIL_W} 0 L 0 ${TAIL_H / 2} L ${TAIL_W} ${TAIL_H}`}
        fill="none"
        stroke="rgba(0,0,0,0.10)"
        strokeWidth={0.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// SVG tail for sent (points right)
function SentTail() {
  return (
    <svg
      width={TAIL_W}
      height={TAIL_H}
      viewBox={`0 0 ${TAIL_W} ${TAIL_H}`}
      style={{ flexShrink: 0, display: "block" }}
    >
      <path d={`M 0 0 L ${TAIL_W} ${TAIL_H / 2} L 0 ${TAIL_H} Z`} fill="#FFEB33" />
    </svg>
  );
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
  const borderRadius = getBubbleRadius(isMe, isFirst, isLast);

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 12, scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.34, 1.2, 0.64, 1] }}
      className={cn(
        "flex items-end gap-[8px]",
        isMe ? "flex-row-reverse" : "flex-row",
        isLast ? "mb-[10px]" : "mb-[2px]"
      )}
    >
      {/* Profile picture column (received only) */}
      {!isMe && (
        <div className="w-[36px] flex-shrink-0 self-end">
          {isLast && (
            <div
              className="w-[36px] h-[36px] overflow-hidden"
              style={{ borderRadius: "22%" }}
            >
              {profileImageDataUrl ? (
                <img
                  src={profileImageDataUrl}
                  alt={participantName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#B0B0B0] flex items-center justify-center">
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
        {/* Name label (received, first in group only) */}
        {!isMe && isFirst && (
          <span className="text-[12px] text-[#555] font-medium mb-[4px] ml-[1px]">
            {participantName}
          </span>
        )}

        {/* Bubble + timestamp row */}
        <div
          className={cn(
            "flex items-end gap-[4px]",
            isMe ? "flex-row-reverse" : "flex-row"
          )}
        >
          {/* ── Bubble with 꼬리 (tail) ── */}
          <div
            className="flex items-start"
            style={{
              // drop-shadow applies to combined shape of tail + bubble body
              filter: !isMe
                ? "drop-shadow(0 1px 2px rgba(0,0,0,0.12))"
                : undefined,
            }}
          >
            {/* Left tail (received first only) */}
            {!isMe && isFirst && <ReceivedTail />}

            {/* Bubble body */}
            <div
              style={{
                background: isMe ? "#FFEB33" : "#FFFFFF",
                borderRadius,
                padding: "9px 12px",
                fontSize: 15,
                lineHeight: 1.42,
                color: "#1a1a1a",
                wordBreak: "break-word",
                // left border removed on received first — tail covers it
                borderTop: !isMe ? "0.5px solid rgba(0,0,0,0.08)" : undefined,
                borderRight: !isMe ? "0.5px solid rgba(0,0,0,0.08)" : undefined,
                borderBottom: !isMe ? "0.5px solid rgba(0,0,0,0.08)" : undefined,
                borderLeft: !isMe && isFirst ? "none" : (!isMe ? "0.5px solid rgba(0,0,0,0.08)" : undefined),
              }}
            >
              {message.text}
            </div>

            {/* Right tail (sent first only) */}
            {isMe && isFirst && <SentTail />}
          </div>

          {/* Timestamp (only on last in group) */}
          {isLast && (
            <div
              className={cn(
                "flex flex-col pb-[3px] flex-shrink-0",
                isMe ? "items-end" : "items-start"
              )}
            >
              {(message.unreadCount ?? 0) > 0 && (
                <span className="text-[11px] text-[#FFCA00] font-bold leading-none mb-[1px]">
                  {message.unreadCount}
                </span>
              )}
              <span className="text-[11px] text-[#8C8C8C] leading-none whitespace-nowrap">
                {message.time}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right spacer for sent messages */}
      {isMe && <div className="w-[36px] flex-shrink-0" />}
    </motion.div>
  );
}
