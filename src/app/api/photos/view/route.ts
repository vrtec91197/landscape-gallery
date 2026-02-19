import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { recordPhotoView } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photoId } = body;

    if (!photoId || typeof photoId !== "number") {
      return NextResponse.json({ error: "photoId is required" }, { status: 400 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("fly-client-ip") ||
      "unknown";

    const ua = request.headers.get("user-agent") || "";
    const ipHash = createHash("sha256").update(`${ip}:${ua}`).digest("hex").substring(0, 16);

    recordPhotoView(photoId, ipHash);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to record" }, { status: 500 });
  }
}
