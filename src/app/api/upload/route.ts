import { NextRequest, NextResponse } from "next/server";
import { processUploadedFile } from "@/lib/scanner";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const authErr = requireAuth(request);
  if (authErr) return authErr;
  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const albumId = formData.get("albumId") as string | null;

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const results = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    // Sanitize filename to prevent path traversal
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const photo = await processUploadedFile(
      buffer,
      safeName,
      albumId ? parseInt(albumId) : undefined
    );
    results.push(photo);
  }

  return NextResponse.json(results);
}
