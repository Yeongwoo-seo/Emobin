import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

const PROMPT = `이것은 카카오톡 대화 스크린샷입니다.
배경화면만 추출하기 위해, 제거해야 할 모든 UI 요소 위치를 JSON으로 반환하세요.

제거 대상:
- statusbar: 최상단 상태바
- header: 헤더 바 (이름, 아이콘)
- profile: 프로필 사진들
- bubble_other: 상대방 말풍선 (흰색, 왼쪽)
- bubble_me: 내 말풍선 (노란색, 오른쪽)
- date_divider: 날짜 구분선
- inputbar: 하단 입력창

이미지 크기 대비 비율(0.0~1.0)로 좌표 계산. 여백 5~10px 추가.
순수 JSON만 반환 (코드블록 없음):

{
  "backgroundColorHex": "#B2C7D9",
  "backgroundType": "solid",
  "regions": [
    {"x": 0.0, "y": 0.0, "w": 1.0, "h": 0.045, "type": "statusbar"},
    {"x": 0.0, "y": 0.045, "w": 1.0, "h": 0.075, "type": "header"},
    {"x": 0.02, "y": 0.14, "w": 0.13, "h": 0.065, "type": "profile"},
    {"x": 0.14, "y": 0.14, "w": 0.56, "h": 0.07, "type": "bubble_other", "label": "메시지"},
    {"x": 0.0, "y": 0.88, "w": 1.0, "h": 0.12, "type": "inputbar"}
  ]
}`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_key_here") {
    return NextResponse.json(getMockResult());
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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType: validMime } },
      PROMPT,
    ]);

    rawText = result.response.text().trim();
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
  if (start === -1 || end === -1) return NextResponse.json(getMockResult());

  let result: BackgroundExtractionResult;
  try {
    result = JSON.parse(rawText.slice(start, end + 1));
  } catch {
    return NextResponse.json(getMockResult());
  }

  if (!result.backgroundColorHex) result.backgroundColorHex = "#B2C7D9";
  if (!Array.isArray(result.regions)) result.regions = [];
  if (!result.backgroundType) result.backgroundType = "solid";

  return NextResponse.json(result);
}

function getMockResult(): BackgroundExtractionResult {
  return {
    backgroundColorHex: "#B2C7D9",
    backgroundType: "solid",
    regions: [
      { x: 0.0, y: 0.0, w: 1.0, h: 0.045, type: "statusbar" },
      { x: 0.0, y: 0.045, w: 1.0, h: 0.075, type: "header" },
      { x: 0.02, y: 0.13, w: 0.13, h: 0.065, type: "profile" },
      { x: 0.15, y: 0.13, w: 0.55, h: 0.07, type: "bubble_other", label: "샘플 메시지" },
      { x: 0.32, y: 0.21, w: 0.63, h: 0.06, type: "bubble_me" },
      { x: 0.0, y: 0.88, w: 1.0, h: 0.12, type: "inputbar" },
    ],
  };
}
