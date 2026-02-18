import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";
import { getAlbum, getPhoto } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Album";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = getAlbum(slug);

  // Try to load the cover photo from disk as a data URL
  let coverDataUrl: string | null = null;
  if (album?.cover_photo_id) {
    const photo = getPhoto(album.cover_photo_id);
    const imgPath = photo?.thumbnail_large_path || photo?.path;
    if (imgPath) {
      // imgPath is like "/photos/..." or "/thumbnails/..." — map to public dir
      const diskPath = path.join(process.cwd(), "public", imgPath);
      if (fs.existsSync(diskPath)) {
        const buffer = fs.readFileSync(diskPath);
        const ext = path.extname(diskPath).toLowerCase();
        const mime =
          ext === ".webp" ? "image/webp" :
          ext === ".png"  ? "image/png"  :
          ext === ".avif" ? "image/avif" :
          "image/jpeg";
        coverDataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
      }
    }
  }

  const title = album?.name ?? "Album";
  const description = album?.description ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
        }}
      >
        {/* Background: cover photo or dark gradient */}
        {coverDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverDataUrl}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            alt=""
          />
        ) : null}

        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: coverDataUrl
              ? "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.2) 100%)"
              : "linear-gradient(135deg, #0a0a0a 0%, #1c1c2e 60%, #16213e 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 64,
          }}
        >
          {/* Branding */}
          <div
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: 6,
              textTransform: "uppercase",
              marginBottom: 20,
              display: "flex",
            }}
          >
            Landscape Gallery
          </div>

          {/* Album name */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.1,
              display: "flex",
            }}
          >
            {title}
          </div>

          {/* Description */}
          {description ? (
            <div
              style={{
                fontSize: 24,
                color: "rgba(255,255,255,0.7)",
                marginTop: 16,
                display: "flex",
                maxWidth: 800,
              }}
            >
              {description.length > 120
                ? description.slice(0, 120) + "…"
                : description}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size }
  );
}
