import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";

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
  inpaintedBackgroundBase64?: string;
}

const DETECT_PROMPT = `이것은 카카오톡 대화 스크린샷입니다.
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

const INPAINT_PROMPT = `이 카카오톡 스크린샷에서 모든 채팅 말풍선, 프로필 사진, 헤더 바, 상태바, 입력창을 완전히 지우고 배경화면만 남겨줘. 말풍선이 있던 자리는 주변 배경과 완전히 자연스럽게 채워줘. 결과는 깨끗한 배경화면 이미지여야 해.`;

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

  const ai = new GoogleGenAI({ apiKey });

  // ── Step 1: 영역 탐지 ──
  let regionResult: BackgroundExtractionResult;
  let rawText: string;
  try {
    const detectResp = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: imageBase64, mimeType: validMime } },
            { text: DETECT_PROMPT },
          ],
        },
      ],
    });
    rawText = (detectResp.text ?? "").trim();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Gemini 영역 탐지 실패: ${msg}` },
      { status: 502 }
    );
  }

  rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");
  if (start === -1 || end === -1) return NextResponse.json(getMockResult());

  try {
    regionResult = JSON.parse(rawText.slice(start, end + 1));
  } catch {
    return NextResponse.json(getMockResult());
  }

  if (!regionResult.backgroundColorHex) regionResult.backgroundColorHex = "#B2C7D9";
  if (!Array.isArray(regionResult.regions)) regionResult.regions = [];
  if (!regionResult.backgroundType) regionResult.backgroundType = "solid";

  // ── Step 2: AI 인페인팅 (Gemini 이미지 생성) ──
  try {
    const inpaintResp = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: imageBase64, mimeType: validMime } },
            { text: INPAINT_PROMPT },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const imagePart = inpaintResp.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.data
    );
    if (imagePart?.inlineData?.data) {
      regionResult.inpaintedBackgroundBase64 = imagePart.inlineData.data;
    }
  } catch {
    // AI 인페인팅 실패 시 canvas 보간 fallback (프론트에서 처리)
  }

  return NextResponse.json(regionResult);
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
