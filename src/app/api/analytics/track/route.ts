import { NextRequest, NextResponse } from "next/server";
import { recordPageView } from "@/lib/analytics";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, referrer, userAgent, ip } = body;

    if (!path) {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }

    recordPageView({
      path,
      referrer: referrer || "",
      userAgent: userAgent || "",
      ip: ip || "",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to record" }, { status: 500 });
  }
}
