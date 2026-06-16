import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { AnalysisResult } from "@/lib/types";

const PROMPT = `이것은 한국 카카오톡 대화 스크린샷입니다.

카카오톡 UI 특징:
- 헤더(상단): 상대방 이름이 중앙에 표시됨
- 받은 메시지(왼쪽): 상대방 프로필 사진(원형) + 흰색/회색 말풍선
- 보낸 메시지(오른쪽): 노란색/황색 말풍선
- 시간 표시 규칙(매우 중요):
  * 같은 발신자가 연속으로 보낸 메시지들은 "그룹"을 형성함
  * 시간은 그 그룹의 마지막 말풍선 아래/옆에만 딱 한 번 표시됨
  * 그 그룹의 앞 말풍선들에는 시간이 보이지 않음
  * 하지만 그 그룹 전체가 동일한 시간을 가짐
  * 예: A가 3개 연속 보내면 → 3번째 말풍선 옆에 "오전 7:35" → 1,2,3번 모두 "오전 7:35"
  * 시간이 안 보이는 말풍선 → 같은 그룹(연속 같은 sender)의 마지막 보이는 시간 사용

아래 형식의 순수 JSON만 반환 (코드블록, 설명 없음):

{
  "participantName": "상대방 이름",
  "profileBounds": {
    "xPercent": 0.03,
    "yPercent": 0.14,
    "widthPercent": 0.11,
    "heightPercent": 0.055
  },
  "messages": [
    {"id": "1", "text": "메시지 내용", "sender": "other", "time": "오전 7:35"}
  ],
  "backgroundColorHex": "#B2C7D9"
}

규칙:
1. messages: 화면 위→아래 순서, 모든 말풍선 빠짐없이 포함
2. 왼쪽 흰 말풍선 = sender: "other", 오른쪽 노란 말풍선 = sender: "me"
3. profileBounds: 첫 번째 프로필 사진 위치 (없으면 null)
4. 모든 메시지에 time 필드 반드시 포함 (그룹 시간 전파 규칙 적용)
5. JSON만 반환`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_key_here") {
    return NextResponse.json({ ...getMockResult(), _source: "mock_no_key" });
  }

  let imageBase64: string;
  let mimeType: string;
  try {
    ({ imageBase64, mimeType } = await request.json());
    if (!imageBase64) throw new Error("imageBase64 missing");
  } catch {
    return NextResponse.json({ error: "요청 파싱 실패" }, { status: 400 });
  }

  const validMime = (
    ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType)
      ? mimeType
      : "image/jpeg"
  ) as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  let rawText: string;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: imageBase64, mimeType: validMime } },
            { text: PROMPT },
          ],
        },
      ],
    });

    rawText = (result.text ?? "").trim();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Gemini API 호출 실패: ${msg}` },
      { status: 502 }
    );
  }

  rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return NextResponse.json(
      { error: "응답에서 JSON을 찾을 수 없음", rawResponse: rawText.slice(0, 400) },
      { status: 422 }
    );
  }

  let parsed: AnalysisResult;
  try {
    parsed = JSON.parse(rawText.slice(start, end + 1));
  } catch (e) {
    return NextResponse.json(
      { error: "JSON 파싱 실패", detail: String(e), rawResponse: rawText.slice(0, 400) },
      { status: 422 }
    );
  }

  if (!parsed.participantName) parsed.participantName = "상대방";
  if (!Array.isArray(parsed.messages)) parsed.messages = [];
  if (!parsed.backgroundColorHex) parsed.backgroundColorHex = "#B2C7D9";

  parsed.messages = parsed.messages.map((m, i) => ({
    id: String(i + 1),
    text: m.text || "",
    sender: m.sender === "me" ? "me" : "other",
    time: m.time || "",
  }));

  // 카카오톡 그룹 시간 전파: 시간이 없는 메시지는 다음 메시지 시간으로 채움
  for (let i = parsed.messages.length - 2; i >= 0; i--) {
    if (!parsed.messages[i].time && parsed.messages[i + 1]?.time) {
      parsed.messages[i].time = parsed.messages[i + 1].time;
    }
  }
  parsed.messages = parsed.messages.map((m) => ({
    ...m,
    time: m.time || "오전 12:00",
  }));

  return NextResponse.json({ ...parsed, _source: "gemini" });
}

function getMockResult(): AnalysisResult {
  return {
    participantName: "샘플 친구",
    profileBounds: { xPercent: 0.032, yPercent: 0.145, widthPercent: 0.108, heightPercent: 0.054 },
    messages: [
      { id: "1", text: "안녕! 오늘 뭐 해?", sender: "other", time: "오후 2:14" },
      { id: "2", text: "나 요즘 바빠서 ㅠ", sender: "other", time: "오후 2:14" },
      { id: "3", text: "ㅋㅋ 나도 오늘 회의 많아", sender: "me", time: "오후 2:15" },
      { id: "4", text: "저녁에 시간 돼?", sender: "me", time: "오후 2:15" },
      { id: "5", text: "응 7시 이후로는 괜찮아", sender: "other", time: "오후 2:17" },
    ],
    backgroundColorHex: "#B2C7D9",
  };
}
