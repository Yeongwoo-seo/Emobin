export interface ChatMessage {
  id: string;
  text: string;
  sender: "me" | "other";
  time: string;
  read: boolean;
  unreadCount?: number;
}

export interface ProfileBounds {
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export interface AnalysisResult {
  participantName: string;
  profileBounds: ProfileBounds | null;
  messages: Omit<ChatMessage, "read">[];
  backgroundColorHex: string;
}

export interface ChatRoomData {
  participantName: string;
  profileImageDataUrl: string | null;
  backgroundDataUrl: string | null;
  backgroundColorHex: string;
  messages: ChatMessage[];
  screenshotDataUrl: string;
}
