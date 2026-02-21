import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

const PUBLIC_DIR = path.join(process.cwd(), "public");

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".png":  "image/png",
  ".gif":  "image/gif",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = path.join(PUBLIC_DIR, "photos", ...segments);

  if (!filePath.startsWith(path.join(PUBLIC_DIR, "photos"))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let stat: fs.Stats;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const etag = `"${stat.mtimeMs.toString(36)}-${stat.size.toString(36)}"`;

  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: { "ETag": etag, "Cache-Control": "public, max-age=2592000, immutable" },
    });
  }

  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "image/jpeg";
  const webStream = Readable.toWeb(fs.createReadStream(filePath)) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "Cache-Control": "public, max-age=2592000, immutable",
      "ETag": etag,
      "Last-Modified": stat.mtime.toUTCString(),
    },
  });
}
