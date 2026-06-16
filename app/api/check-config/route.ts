import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  const isSet = !!key && key !== "your_gemini_key_here" && key.length > 10;
  return NextResponse.json({
    apiKeySet: isSet,
    provider: "gemini",
    hint: isSet ? null : "GEMINI_API_KEY가 설정되지 않았습니다",
  });
}
