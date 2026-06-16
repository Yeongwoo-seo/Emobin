import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult } from "@/lib/types";

const SYSTEM_PROMPT = `당신은 카카오톡 UI 전문 분석가입니다. 스크린샷에서 정보를 정확하게 추출합니다.`;

const USER_PROMPT = `이것은 한국 카카오톡 대화 스크린샷입니다.

카카오톡 UI 특징 (참고):
- 헤더(상단): 상대방 이름이 가운데 또는 좌측에 표시됨, 뒤로가기 화살표, 전화/검색 아이콘
- 받은 메시지(왼쪽): 상대방 프로필 사진(원형, 왼쪽) + 흰색/회색 말풍선
- 보낸 메시지(오른쪽): 노란색/황색 말풍선 (#FFEB33 계열)
- 시간: 말풍선 바깥쪽에 "오전/오후 H:MM" 형식
- 안읽음: 말풍선 위에 숫자(노란색)
- 배경: 카카오톡 기본 파란색(#B2C7D9) 또는 사용자 설정 배경

아래 형식의 JSON만 반환하세요. 다른 텍스트, 마크다운, 코드블록 없이 순수 JSON만 반환:

{
  "participantName": "상대방 이름 (헤더에서 추출)",
  "profileBounds": {
    "xPercent": 0.0~1.0 사이 실수,
    "yPercent": 0.0~1.0 사이 실수,
    "widthPercent": 0.0~1.0 사이 실수,
    "heightPercent": 0.0~1.0 사이 실수
  },
  "messages": [
    {
      "id": "1",
      "text": "정확한 메시지 텍스트",
      "sender": "other" 또는 "me",
      "time": "오후 2:14" 형식
    }
  ],
  "backgroundColorHex": "#16진수 색상코드"
}

중요 규칙:
1. messages는 화면 위→아래 순서로 정렬
2. 왼쪽 말풍선 = sender: "other", 오른쪽 노란 말풍선 = sender: "me"
3. profileBounds: 첫 번째로 보이는 상대방 프로필 사진 위치 (없으면 null)
4. 텍스트 없는 메시지는 "[이미지]", "[스티커]" 등으로 표기
5. JSON만 반환 (다른 텍스트 절대 금지)`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // No key → return mock with clear flag
  if (!apiKey || apiKey === "your_api_key_here" || !apiKey.startsWith("sk-")) {
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

  // Always create client inside handler so env var is fresh
  const client = new Anthropic({ apiKey });

  const validMime = (
    ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType)
      ? mimeType
      : "image/jpeg"
  ) as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  let rawText: string;
  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: validMime, data: imageBase64 },
            },
            { type: "text", text: USER_PROMPT },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Claude 응답 타입 오류", detail: content.type },
        { status: 502 }
      );
    }
    rawText = content.text.trim();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Claude API 호출 실패: ${msg}` },
      { status: 502 }
    );
  }

  // Strip markdown fences
  rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return NextResponse.json(
      { error: "Claude 응답에서 JSON을 찾을 수 없음", rawResponse: rawText.slice(0, 400) },
      { status: 422 }
    );
  }

  let result: AnalysisResult;
  try {
    result = JSON.parse(rawText.slice(start, end + 1));
  } catch (parseErr) {
    return NextResponse.json(
      {
        error: "JSON 파싱 실패",
        detail: String(parseErr),
        rawResponse: rawText.slice(0, 400),
      },
      { status: 422 }
    );
  }

  // Sanitize
  if (!result.participantName) result.participantName = "상대방";
  if (!Array.isArray(result.messages)) result.messages = [];
  if (!result.backgroundColorHex) result.backgroundColorHex = "#B2C7D9";
  result.messages = result.messages.map((m, i) => ({
    id: String(i + 1),
    text: m.text || "",
    sender: m.sender === "me" ? "me" : "other",
    time: m.time || "오후 12:00",
  }));

  return NextResponse.json({ ...result, _source: "claude" });
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
      { id: "6", text: "그럼 새로 생긴 파스타 집 어때?", sender: "me", time: "오후 2:18" },
      { id: "7", text: "오 좋아!! 예약해줘 ㅎㅎ", sender: "other", time: "오후 2:19" },
    ],
    backgroundColorHex: "#B2C7D9",
  };
}
