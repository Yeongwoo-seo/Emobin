"use client";

import { useEffect, useRef, useState } from "react";
import { useEmobinStore } from "@/lib/store";
import MessageBubble from "./MessageBubble";
import DateSeparator from "./DateSeparator";
import type { ChatMessage } from "@/lib/types";

function getTodayLabel() {
  const now = new Date();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${days[now.getDay()]}요일`;
}

interface MessageGroup {
  sender: "me" | "other";
  messages: ChatMessage[];
}

function groupMessages(messages: ChatMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let cur: MessageGroup | null = null;

  for (const msg of messages) {
    if (!cur || cur.sender !== msg.sender) {
      cur = { sender: msg.sender, messages: [msg] };
      groups.push(cur);
    } else {
      cur.messages.push(msg);
    }
  }
  return groups;
}

export default function MessageList() {
  const chatRoomData = useEmobinStore((s) => s.chatRoomData);
  const listRef = useRef<HTMLDivElement>(null);
  const [newMsgIds, setNewMsgIds] = useState<Set<string>>(new Set());
  const prevLengthRef = useRef(0);

  useEffect(() => {
    const messages = chatRoomData?.messages ?? [];
    if (messages.length > prevLengthRef.current && prevLengthRef.current > 0) {
      const newest = messages[messages.length - 1];
      setNewMsgIds((prev) => new Set(Array.from(prev).concat(newest.id)));
      setTimeout(() => {
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 50);
    }
    prevLengthRef.current = messages.length;
  }, [chatRoomData?.messages]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, []);

  if (!chatRoomData) return null;

  const { messages, profileImageDataUrl, participantName } = chatRoomData;
  const groups = groupMessages(messages);

  return (
    <div
      ref={listRef}
      className="flex-1 overflow-y-auto scrollbar-hide py-3 px-3"
    >
      <DateSeparator label={getTodayLabel()} />

      {groups.map((group, gi) => (
        <div key={gi} className="mb-1">
          {group.messages.map((msg, mi) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              profileImageDataUrl={profileImageDataUrl}
              participantName={participantName}
              showProfile={mi === group.messages.length - 1}
              showName={mi === 0}
              isFirst={mi === 0}
              isLast={mi === group.messages.length - 1}
              isNew={newMsgIds.has(msg.id)}
            />
          ))}
        </div>
      ))}

      {/* Bottom padding for input bar */}
      <div className="h-2" />
    </div>
  );
}
