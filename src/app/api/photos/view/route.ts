import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { recordPhotoView, logPhotoView } from "@/lib/db";

const BOT_PATTERN = /bot|crawl|spider|slurp|googlebot|bingbot|yandex|baidu|duckduck/i;
const PRIVATE_IP = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd)/;

function parseBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  if (/Opera|OPR\//i.test(ua)) return "Opera";
  return "Other";
}

function parseDevice(ua: string): string {
  if (/Mobile|Android.*Mobile|iPhone|iPod/i.test(ua)) return "Mobile";
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) return "Tablet";
  return "Desktop";
}

async function resolveCountry(ip: string): Promise<string> {
  if (!ip || ip === "unknown" || PRIVATE_IP.test(ip)) return "";
  try {
    const res = await fetch(`https://ipapi.co/${ip}/country_name/`, {
      signal: AbortSignal.timeout(2000),
      headers: { "User-Agent": "landscape-gallery/1.0" },
    });
    if (res.ok) {
      const text = (await res.text()).trim();
      if (text && !text.toLowerCase().includes("invalid") && text.length < 100) return text;
    }
  } catch {
    // best-effort
  }
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photoId } = body;

    if (!photoId || typeof photoId !== "number") {
      return NextResponse.json({ error: "photoId is required" }, { status: 400 });
    }

    const ua = request.headers.get("user-agent") || "";
    if (BOT_PATTERN.test(ua)) return NextResponse.json({ success: true });

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("fly-client-ip") ||
      "unknown";

    const ipHash = createHash("sha256").update(`${ip}:${ua}`).digest("hex").substring(0, 16);
    const browser = parseBrowser(ua);
    const device = parseDevice(ua);

    // Record unique view (for the count badge)
    recordPhotoView(photoId, ipHash);

    // Log full view event with metadata (non-blocking)
    resolveCountry(ip).then((country) => {
      logPhotoView(photoId, ipHash, browser, device, country);
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to record" }, { status: 500 });
  }
}
