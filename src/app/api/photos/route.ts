import { NextRequest, NextResponse } from "next/server";
import { getPhotos, getPhotoCount, getPhoto, updatePhoto, deletePhoto } from "@/lib/db";
import { scanPhotos } from "@/lib/scanner";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const albumId = request.nextUrl.searchParams.get("albumId");
  const limit = request.nextUrl.searchParams.get("limit");
  const offset = request.nextUrl.searchParams.get("offset");

  const parsedAlbumId = albumId ? parseInt(albumId) : undefined;
  const photos = getPhotos(
    parsedAlbumId,
    limit ? parseInt(limit) : undefined,
    offset ? parseInt(offset) : undefined
  );
  const total = getPhotoCount(parsedAlbumId);

  return NextResponse.json({ photos, total });
}

export async function POST(request: NextRequest) {
  const authErr = requireAuth(request);
  if (authErr) return authErr;

  // Trigger folder scan
  const result = await scanPhotos();
  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  const authErr = requireAuth(request);
  if (authErr) return authErr;

  const body = await request.json();
  const { id, album_id, filename } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = getPhoto(id);
  if (!existing) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const updated = updatePhoto(id, { album_id, filename });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const authErr = requireAuth(request);
  if (authErr) return authErr;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  deletePhoto(parseInt(id));
  return NextResponse.json({ success: true });
}
