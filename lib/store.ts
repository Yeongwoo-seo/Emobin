import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, ChatRoomData } from "./types";
import { v4 as uuidv4 } from "uuid";

interface EmobinStore {
  screenshotDataUrl: string | null;
  chatRoomData: ChatRoomData | null;
  setScreenshot: (dataUrl: string) => void;
  setChatRoomData: (data: ChatRoomData) => void;
  addMessage: (text: string) => void;
  clearAll: () => void;
}

export const useEmobinStore = create<EmobinStore>()(
  persist(
    (set, get) => ({
      screenshotDataUrl: null,
      chatRoomData: null,

      setScreenshot: (dataUrl) => set({ screenshotDataUrl: dataUrl }),

      setChatRoomData: (data) => set({ chatRoomData: data }),

      addMessage: (text) => {
        const store = get();
        if (!store.chatRoomData) return;

        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, "0");
        const period = hours >= 12 ? "오후" : "오전";
        const hour12 = hours % 12 || 12;
        const timeStr = `${period} ${hour12}:${minutes}`;

        const newMsg: ChatMessage = {
          id: uuidv4(),
          text,
          sender: "me",
          time: timeStr,
          read: false,
          unreadCount: 1,
        };

        set({
          chatRoomData: {
            ...store.chatRoomData!,
            messages: [...store.chatRoomData!.messages, newMsg],
          },
        });
      },

      clearAll: () => set({ screenshotDataUrl: null, chatRoomData: null }),
    }),
    {
      name: "emobin-storage",
      partialize: (state) => ({
        chatRoomData: state.chatRoomData
          ? {
              ...state.chatRoomData,
              screenshotDataUrl: "",
            }
          : null,
      }),
    }
  )
);
