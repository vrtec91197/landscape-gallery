import { NextRequest, NextResponse } from "next/server";
import { recordPageView } from "@/lib/analytics";

const PRIVATE_IP = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd)/;

async function resolveCountry(ip: string): Promise<string> {
  if (!ip || ip === "unknown" || PRIVATE_IP.test(ip)) return "";
  try {
    const res = await fetch(`https://ipapi.co/${ip}/country_name/`, {
      signal: AbortSignal.timeout(2000),
      headers: { "User-Agent": "landscape-gallery/1.0" },
    });
    if (res.ok) {
      const text = (await res.text()).trim();
      // ipapi.co returns an error string when IP is invalid
      if (text && !text.toLowerCase().includes("invalid") && text.length < 100) {
        return text;
      }
    }
  } catch {
    // ignore — country is best-effort
  }
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, referrer, userAgent, ip } = body;

    if (!path) {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }

    const country = await resolveCountry(ip || "");

    recordPageView({
      path,
      referrer: referrer || "",
      userAgent: userAgent || "",
      ip: ip || "",
      country,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to record" }, { status: 500 });
  }
}
