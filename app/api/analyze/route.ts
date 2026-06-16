import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult } from "@/lib/types";

const client = new Anthropic();

const ANALYSIS_PROMPT = `당신은 카카오톡 대화 스크린샷을 분석하는 전문가입니다.
주어진 카카오톡 스크린샷에서 다음 정보를 JSON 형식으로 추출해주세요:

1. participantName: 상대방의 이름 (채팅방 제목 또는 헤더에서 추출)
2. profileBounds: 상대방 프로필 사진의 위치 (이미지 전체 크기 대비 비율, 0~1 사이 값)
   - 프로필 사진이 보이지 않으면 null
   - xPercent: 왼쪽 상단 x 좌표 비율
   - yPercent: 왼쪽 상단 y 좌표 비율
   - widthPercent: 너비 비율
   - heightPercent: 높이 비율
3. messages: 보이는 모든 메시지 목록 (순서대로)
   - id: 순번 문자열
   - text: 메시지 내용
   - sender: "me"(내가 보낸 것, 오른쪽 노란 말풍선) 또는 "other"(상대방, 왼쪽 흰색 말풍선)
   - time: 표시된 시간 (예: "오후 2:14")
4. backgroundColorHex: 배경 색상 (헥스 코드, 예: "#B2C7D9")

반드시 유효한 JSON만 반환하고, 다른 텍스트는 포함하지 마세요.
JSON 구조:
{
  "participantName": "이름",
  "profileBounds": {"xPercent": 0.03, "yPercent": 0.12, "widthPercent": 0.1, "heightPercent": 0.06} or null,
  "messages": [{"id": "1", "text": "메시지", "sender": "other", "time": "오후 2:14"}],
  "backgroundColorHex": "#B2C7D9"
}`;

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "이미지가 필요합니다." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(getMockResult(), { status: 200 });
    }

    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: (mimeType || "image/png") as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "분석 실패" }, { status: 500 });
    }

    let result: AnalysisResult;
    try {
      const jsonText = content.text.trim().replace(/```json\n?|\n?```/g, "");
      result = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(getMockResult(), { status: 200 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(getMockResult(), { status: 200 });
  }
}

function getMockResult(): AnalysisResult {
  return {
    participantName: "상대방",
    profileBounds: {
      xPercent: 0.03,
      yPercent: 0.14,
      widthPercent: 0.11,
      heightPercent: 0.055,
    },
    messages: [
      { id: "1", text: "안녕!", sender: "other", time: "오후 2:14" },
      { id: "2", text: "오늘 어때?", sender: "other", time: "오후 2:14" },
      { id: "3", text: "좋아! 같이 점심 먹을래?", sender: "me", time: "오후 2:15" },
      { id: "4", text: "그래, 어디서 먹을까?", sender: "other", time: "오후 2:16" },
      { id: "5", text: "새로 생긴 파스타 집 어때?", sender: "me", time: "오후 2:17" },
    ],
    backgroundColorHex: "#B2C7D9",
  };
}
