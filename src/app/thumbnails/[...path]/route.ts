import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PUBLIC_DIR = path.join(process.cwd(), "public");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = path.join(PUBLIC_DIR, "thumbnails", ...segments);

  // Prevent path traversal
  if (!filePath.startsWith(path.join(PUBLIC_DIR, "thumbnails"))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType =
    ext === ".webp" ? "image/webp" :
    ext === ".avif" ? "image/avif" :
    ext === ".png" ? "image/png" :
    "image/jpeg";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=2592000, immutable",
    },
  });
}
