import fs from "fs";
import path from "path";
import sharp from "sharp";
import { createPhoto, photoExistsByPath, getPhotosWithoutSize, updatePhotoSize, getPhotos, getDb, getPhotosWithoutHue, updatePhotoDominantHue } from "./db";
import { extractExif } from "./exif";

const SCAN_DIR = process.env.SCAN_DIR || path.join(process.cwd(), "photos");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const PHOTOS_DIR = path.join(PUBLIC_DIR, "photos");
const THUMBS_DIR = path.join(PUBLIC_DIR, "thumbnails");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif"]);

function rgbToHue(r: number, g: number, b: number): number | null {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  if (delta < 0.1) return null; // achromatic / near-grayscale
  let h = 0;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return h;
}

async function extractDominantHue(input: Buffer | string): Promise<number | null> {
  try {
    const stats = await sharp(input).stats();
    const d = (stats as unknown as { dominant?: { r: number; g: number; b: number } }).dominant;
    if (!d) return null;
    return rgbToHue(d.r, d.g, d.b);
  } catch {
    return null;
  }
}

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

async function generateBlurDataUrl(input: Buffer | string): Promise<string> {
  const blurBuffer = await sharp(input)
    .resize(16, 16, { fit: "inside" })
    .blur(4)
    .webp({ quality: 20 })
    .toBuffer();
  return `data:image/webp;base64,${blurBuffer.toString("base64")}`;
}

interface ProcessedImage {
  metadata: sharp.Metadata;
  thumbFilename: string;
  thumbLargeFilename: string;
  blurDataUrl: string;
}

async function processImage(input: Buffer | string, filename: string): Promise<ProcessedImage> {
  const metadata = await sharp(input).metadata();
  const baseName = filename.replace(/\.[^.]+$/, "");

  // Small thumbnail (600px) for grid
  const thumbFilename = `thumb_${baseName}.webp`;
  const thumbPath = path.join(THUMBS_DIR, thumbFilename);
  await sharp(input)
    .resize(600, 600, { fit: "inside", withoutEnlargement: true })
    .sharpen({ sigma: 0.5, m1: 0.5, m2: 0.5 })
    .webp({ quality: 82 })
    .toFile(thumbPath);

  // Large thumbnail (1200px) for high-DPI grid and lightbox preload
  const thumbLargeFilename = `thumb_lg_${baseName}.webp`;
  const thumbLargePath = path.join(THUMBS_DIR, thumbLargeFilename);
  await sharp(input)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .sharpen({ sigma: 0.5, m1: 0.5, m2: 0.5 })
    .webp({ quality: 85 })
    .toFile(thumbLargePath);

  // Blur placeholder
  const blurDataUrl = await generateBlurDataUrl(input);

  return { metadata, thumbFilename, thumbLargeFilename, blurDataUrl };
}

export async function backfillExif(): Promise<number> {
  const db = getDb();
  const photos = db.prepare("SELECT id, path FROM photos WHERE exif_json = '{}' OR exif_json IS NULL OR exif_json = ''").all() as { id: number; path: string }[];
  let updated = 0;
  for (const photo of photos) {
    const fullPath = path.join(PUBLIC_DIR, photo.path);
    try {
      const exif = await extractExif(fullPath);
      const json = JSON.stringify(exif);
      if (json !== "{}") {
        db.prepare("UPDATE photos SET exif_json = ? WHERE id = ?").run(json, photo.id);
        updated++;
      }
    } catch {
      // skip
    }
  }
  return updated;
}

export function backfillFileSizes(): number {
  const photos = getPhotosWithoutSize();
  let updated = 0;
  for (const photo of photos) {
    const fullPath = path.join(PUBLIC_DIR, photo.path);
    try {
      const stat = fs.statSync(fullPath);
      updatePhotoSize(photo.id, stat.size);
      updated++;
    } catch {
      // File not found on disk — skip
    }
  }
  return updated;
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

      const fileSizeBytes = fs.statSync(imagePath).size;
      const { metadata, thumbFilename, thumbLargeFilename, blurDataUrl } =
        await processImage(imagePath, filename);

      // Extract EXIF
      const exif = await extractExif(imagePath);

      const dominantHue = await extractDominantHue(imagePath);

      createPhoto({
        filename,
        path: publicPath,
        width: metadata.width || 0,
        height: metadata.height || 0,
        thumbnail_path: `/thumbnails/${thumbFilename}`,
        thumbnail_large_path: `/thumbnails/${thumbLargeFilename}`,
        blur_data_url: blurDataUrl,
        album_id: null,
        exif_json: JSON.stringify(exif),
        file_size_bytes: fileSizeBytes,
        dominant_hue: dominantHue,
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

  const fileSizeBytes = buffer.length;
  const { metadata, thumbFilename, thumbLargeFilename, blurDataUrl } =
    await processImage(buffer, filename);

  // Extract EXIF
  const exif = await extractExif(destPath);

  const dominantHue = await extractDominantHue(buffer);

  return createPhoto({
    filename,
    path: `/photos/${filename}`,
    width: metadata.width || 0,
    height: metadata.height || 0,
    thumbnail_path: `/thumbnails/${thumbFilename}`,
    thumbnail_large_path: `/thumbnails/${thumbLargeFilename}`,
    blur_data_url: blurDataUrl,
    album_id: albumId || null,
    exif_json: JSON.stringify(exif),
    file_size_bytes: fileSizeBytes,
    dominant_hue: dominantHue,
  });
}

export async function backfillDominantHue(): Promise<number> {
  const photos = getPhotosWithoutHue();
  let updated = 0;
  for (const photo of photos) {
    const fullPath = path.join(PUBLIC_DIR, photo.path);
    try {
      const hue = await extractDominantHue(fullPath);
      updatePhotoDominantHue(photo.id, hue);
      updated++;
    } catch {
      // skip
    }
  }
  return updated;
}
