import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
  type: "statusbar" | "header" | "profile" | "bubble_other" | "bubble_me" | "inputbar" | "date_divider";
  label?: string;
}

export interface BackgroundExtractionResult {
  backgroundColorHex: string;
  backgroundType: "solid" | "image";
  regions: Region[];
}

const client = new Anthropic();

const PROMPT = `이것은 카카오톡 대화 스크린샷입니다.
배경화면만 추출하기 위해, 제거해야 할 모든 UI 요소의 위치를 찾아주세요.

제거 대상:
- statusbar: 최상단 상태바 (시간, 배터리 등)
- header: 헤더 바 (이름, 뒤로가기, 아이콘)
- profile: 프로필 사진들 (원형 이미지, 왼쪽에 위치)
- bubble_other: 상대방 말풍선 (흰색, 왼쪽)
- bubble_me: 내 말풍선 (노란색, 오른쪽)
- date_divider: 날짜 구분선
- inputbar: 하단 입력창

이미지 전체 크기 대비 비율(0.0~1.0)로 각 요소 위치를 구하세요.
bubbles는 텍스트 포함 전체 말풍선 영역으로 지정하고, 모든 말풍선을 하나도 빠짐없이 포함해야 합니다.
여백을 약간 더해서(5~10px 해당 비율) 지정하세요.

반드시 순수 JSON만 반환 (코드블록, 설명 없음):
{
  "backgroundColorHex": "#B2C7D9",
  "backgroundType": "solid",
  "regions": [
    {"x": 0.0, "y": 0.0, "w": 1.0, "h": 0.045, "type": "statusbar"},
    {"x": 0.0, "y": 0.045, "w": 1.0, "h": 0.075, "type": "header"},
    {"x": 0.02, "y": 0.14, "w": 0.13, "h": 0.065, "type": "profile", "label": "프로필"},
    {"x": 0.14, "y": 0.14, "w": 0.56, "h": 0.065, "type": "bubble_other", "label": "안녕!"},
    {"x": 0.35, "y": 0.22, "w": 0.60, "h": 0.055, "type": "bubble_me", "label": "ㅋㅋ"},
    {"x": 0.0, "y": 0.88, "w": 1.0, "h": 0.12, "type": "inputbar"}
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "이미지 필요" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") {
      return NextResponse.json(getMockResult());
    }

    const validMime = (
      ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType)
        ? mimeType
        : "image/jpeg"
    ) as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: validMime, data: imageBase64 },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") return NextResponse.json(getMockResult());

    let raw = content.text.trim();
    raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) return NextResponse.json(getMockResult());

    let result: BackgroundExtractionResult;
    try {
      result = JSON.parse(raw.slice(start, end + 1));
    } catch {
      return NextResponse.json(getMockResult());
    }

    if (!result.backgroundColorHex) result.backgroundColorHex = "#B2C7D9";
    if (!Array.isArray(result.regions)) result.regions = [];
    if (!result.backgroundType) result.backgroundType = "solid";

    return NextResponse.json(result);
  } catch (error) {
    console.error("[extract-background]", error);
    return NextResponse.json(getMockResult());
  }
}

function getMockResult(): BackgroundExtractionResult {
  return {
    backgroundColorHex: "#B2C7D9",
    backgroundType: "solid",
    regions: [
      { x: 0.0, y: 0.0, w: 1.0, h: 0.045, type: "statusbar" },
      { x: 0.0, y: 0.045, w: 1.0, h: 0.075, type: "header" },
      { x: 0.02, y: 0.13, w: 0.13, h: 0.065, type: "profile" },
      { x: 0.15, y: 0.13, w: 0.55, h: 0.07, type: "bubble_other", label: "안녕! 오늘 뭐 해?" },
      { x: 0.32, y: 0.21, w: 0.63, h: 0.06, type: "bubble_me", label: "나 요즘 바빠서 ㅠ" },
      { x: 0.15, y: 0.28, w: 0.52, h: 0.06, type: "bubble_other", label: "저녁에 시간 돼?" },
      { x: 0.25, y: 0.35, w: 0.70, h: 0.06, type: "bubble_me", label: "응 7시 이후로는 괜찮아" },
      { x: 0.0, y: 0.88, w: 1.0, h: 0.12, type: "inputbar" },
    ],
  };
}
