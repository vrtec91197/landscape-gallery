import { NextRequest, NextResponse } from "next/server";
import { getAlbums, createAlbum, getAlbum } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const albums = getAlbums();
  return NextResponse.json(albums);
}

export async function POST(request: NextRequest) {
  const authErr = requireAuth(request);
  if (authErr) return authErr;
  const body = await request.json();
  const { name, description } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const existing = getAlbum(slug);
  if (existing) {
    return NextResponse.json({ error: "Album with this name already exists" }, { status: 409 });
  }

  const album = createAlbum({ name, slug, description });
  return NextResponse.json(album);
}
