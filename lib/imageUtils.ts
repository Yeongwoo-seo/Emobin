import type { ProfileBounds } from "./types";

export function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export async function cropProfileCircle(
  screenshotDataUrl: string,
  bounds: ProfileBounds,
  outputSize = 200
): Promise<string> {
  return cropProfileSquircle(screenshotDataUrl, bounds, outputSize);
}

// KakaoTalk profile shape: squircle matching iOS app-icon shape (~22% corner radius)
export async function cropProfileSquircle(
  screenshotDataUrl: string,
  bounds: ProfileBounds,
  outputSize = 200
): Promise<string> {
  const img = await loadImage(screenshotDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d")!;

  const srcX = bounds.xPercent * img.naturalWidth;
  const srcY = bounds.yPercent * img.naturalHeight;
  const srcW = bounds.widthPercent * img.naturalWidth;
  const srcH = bounds.heightPercent * img.naturalHeight;

  // iOS squircle approximation: ~22% corner radius fills photo snugly
  const r = outputSize * 0.22;
  ctx.beginPath();
  ctx.roundRect(0, 0, outputSize, outputSize, r);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputSize, outputSize);

  return canvas.toDataURL("image/png");
}

export async function createBlurredBackground(
  screenshotDataUrl: string
): Promise<string> {
  const img = await loadImage(screenshotDataUrl);
  const canvas = document.createElement("canvas");
  const scale = 0.5;
  canvas.width = img.naturalWidth * scale;
  canvas.height = img.naturalHeight * scale;
  const ctx = canvas.getContext("2d")!;

  ctx.filter = "blur(24px) brightness(0.85) saturate(1.2)";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.8);
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(",")[1];
}

export function getMimeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match ? match[1] : "image/png";
}

export async function resizeImage(
  dataUrl: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> {
  const img = await loadImage(dataUrl);
  const ratio = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight, 1);
  const w = Math.round(img.naturalWidth * ratio);
  const h = Math.round(img.naturalHeight * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.9);
}
