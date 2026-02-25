import { NextRequest, NextResponse } from "next/server";
import { getTags, createTag, getPhotoTags } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const photoId = request.nextUrl.searchParams.get("photoId");
  if (photoId) {
    const tags = getPhotoTags(parseInt(photoId));
    return NextResponse.json(tags);
  }
  const tags = getTags();
  return NextResponse.json(tags);
}

export async function POST(request: NextRequest) {
  const authErr = requireAuth(request);
  if (authErr) return authErr;

  const { name } = await request.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const tag = createTag(name.trim());
  return NextResponse.json(tag);
}
