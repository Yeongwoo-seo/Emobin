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

export default function MessageList() {
  const chatRoomData = useEmobinStore((s) => s.chatRoomData);
  const listRef = useRef<HTMLDivElement>(null);
  const [newMsgIds, setNewMsgIds] = useState<Set<string>>(new Set());
  const prevLengthRef = useRef(0);

  useEffect(() => {
    const messages = chatRoomData?.messages ?? [];
    if (messages.length > prevLengthRef.current) {
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

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, []);

  if (!chatRoomData) return null;

  const { messages, profileImageDataUrl, participantName } = chatRoomData;

  const grouped = groupMessages(messages);

  return (
    <div
      ref={listRef}
      className="flex-1 overflow-y-auto scrollbar-hide px-3 py-4 flex flex-col"
    >
      <DateSeparator label={getTodayLabel()} />

      {grouped.map((group) => (
        <div key={group[0].id}>
          {group.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              profileImageDataUrl={profileImageDataUrl}
              participantName={participantName}
              showProfile={i === group.length - 1}
              showName={i === 0}
              isNew={newMsgIds.has(msg.id)}
            />
          ))}
          <div className="mb-2" />
        </div>
      ))}
    </div>
  );
}

function groupMessages(messages: ChatMessage[]): ChatMessage[][] {
  const groups: ChatMessage[][] = [];
  let currentGroup: ChatMessage[] = [];
  let currentSender: string | null = null;

  for (const msg of messages) {
    if (msg.sender !== currentSender) {
      if (currentGroup.length > 0) groups.push(currentGroup);
      currentGroup = [msg];
      currentSender = msg.sender;
    } else {
      currentGroup.push(msg);
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  return groups;
}
