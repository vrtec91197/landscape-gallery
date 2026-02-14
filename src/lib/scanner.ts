import fs from "fs";
import path from "path";
import sharp from "sharp";
import { createPhoto, photoExistsByPath } from "./db";
import { extractExif } from "./exif";

const SCAN_DIR = process.env.SCAN_DIR || path.join(process.cwd(), "photos");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const PHOTOS_DIR = path.join(PUBLIC_DIR, "photos");
const THUMBS_DIR = path.join(PUBLIC_DIR, "thumbnails");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif"]);

function ensureDirs() {
  for (const dir of [PHOTOS_DIR, THUMBS_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

function findImages(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findImages(fullPath));
    } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }
  return results;
}

export async function scanPhotos(): Promise<{ added: number; skipped: number }> {
  ensureDirs();

  const images = findImages(SCAN_DIR);
  let added = 0;
  let skipped = 0;

  for (const imagePath of images) {
    const filename = path.basename(imagePath);
    const publicPath = `/photos/${filename}`;

    if (photoExistsByPath(publicPath)) {
      skipped++;
      continue;
    }

    try {
      // Copy to public/photos
      const destPath = path.join(PHOTOS_DIR, filename);
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(imagePath, destPath);
      }

      // Generate thumbnail
      const thumbFilename = `thumb_${filename.replace(/\.[^.]+$/, ".webp")}`;
      const thumbPath = path.join(THUMBS_DIR, thumbFilename);
      const metadata = await sharp(imagePath).metadata();

      await sharp(imagePath)
        .resize(400, 400, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(thumbPath);

      // Extract EXIF
      const exif = await extractExif(imagePath);

      createPhoto({
        filename,
        path: publicPath,
        width: metadata.width || 0,
        height: metadata.height || 0,
        thumbnail_path: `/thumbnails/${thumbFilename}`,
        album_id: null,
        exif_json: JSON.stringify(exif),
      });

      added++;
    } catch (err) {
      console.error(`Failed to process ${imagePath}:`, err);
      skipped++;
    }
  }

  return { added, skipped };
}

export async function processUploadedFile(
  buffer: Buffer,
  filename: string,
  albumId?: number
): Promise<ReturnType<typeof createPhoto>> {
  ensureDirs();

  // Save original
  const destPath = path.join(PHOTOS_DIR, filename);
  fs.writeFileSync(destPath, buffer);

  // Generate thumbnail
  const thumbFilename = `thumb_${filename.replace(/\.[^.]+$/, ".webp")}`;
  const thumbPath = path.join(THUMBS_DIR, thumbFilename);
  const metadata = await sharp(buffer).metadata();

  await sharp(buffer)
    .resize(400, 400, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  // Extract EXIF
  const exif = await extractExif(destPath);

  return createPhoto({
    filename,
    path: `/photos/${filename}`,
    width: metadata.width || 0,
    height: metadata.height || 0,
    thumbnail_path: `/thumbnails/${thumbFilename}`,
    album_id: albumId || null,
    exif_json: JSON.stringify(exif),
  });
}
