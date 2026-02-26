import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPhotoViewers } from "@/lib/db";

export async function GET(request: NextRequest) {
  const authErr = requireAuth(request);
  if (authErr) return authErr;

  const photoId = request.nextUrl.searchParams.get("photoId");
  if (!photoId || isNaN(parseInt(photoId))) {
    return NextResponse.json({ error: "photoId is required" }, { status: 400 });
  }

  const viewers = getPhotoViewers(parseInt(photoId));
  return NextResponse.json(viewers);
}
