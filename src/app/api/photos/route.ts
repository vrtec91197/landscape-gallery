import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getPhotos, getPhotoCount, getPhoto, updatePhoto, deletePhoto } from "@/lib/db";
import { scanPhotos, backfillFileSizes, backfillExif } from "@/lib/scanner";
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

  // Trigger folder scan + backfill sizes and EXIF for existing photos
  const result = await scanPhotos();
  const backfilled = backfillFileSizes();
  const exifBackfilled = await backfillExif();
  return NextResponse.json({ ...result, backfilled, exifBackfilled });
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

  const photo = getPhoto(parseInt(id));
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Remove physical files from disk
  const publicDir = path.join(process.cwd(), "public");
  const filesToDelete = [
    photo.path,
    photo.thumbnail_path,
    photo.thumbnail_large_path,
  ].filter(Boolean);

  for (const filePath of filesToDelete) {
    const fullPath = path.join(publicDir, filePath);
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      console.error(`Failed to delete file ${fullPath}:`, err);
    }
  }

  deletePhoto(parseInt(id));
  return NextResponse.json({ success: true });
}
