import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  const isSet = !!key && key !== "your_api_key_here" && key.startsWith("sk-");
  return NextResponse.json({
    apiKeySet: isSet,
    hint: isSet ? null : "ANTHROPIC_API_KEY가 설정되지 않았거나 올바르지 않습니다",
  });
}
