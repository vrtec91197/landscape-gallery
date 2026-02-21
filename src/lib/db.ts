import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "gallery.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.pragma("cache_size = -32000");    // 32 MB page cache
    db.pragma("temp_store = memory");    // temp tables in RAM
    db.pragma("mmap_size = 268435456");  // 256 MB memory-mapped I/O
    db.pragma("synchronous = NORMAL");   // safe with WAL, faster than FULL
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      cover_photo_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      width INTEGER DEFAULT 0,
      height INTEGER DEFAULT 0,
      thumbnail_path TEXT DEFAULT '',
      thumbnail_large_path TEXT DEFAULT '',
      blur_data_url TEXT DEFAULT '',
      album_id INTEGER REFERENCES albums(id) ON DELETE SET NULL,
      exif_json TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_photos_album ON photos(album_id);
    CREATE INDEX IF NOT EXISTS idx_albums_slug ON albums(slug);

    CREATE TABLE IF NOT EXISTS page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      referrer TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      ip_hash TEXT DEFAULT '',
      country TEXT DEFAULT '',
      browser TEXT DEFAULT '',
      device TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_pv_created ON page_views(created_at);
    CREATE INDEX IF NOT EXISTS idx_pv_path ON page_views(path);

    CREATE TABLE IF NOT EXISTS photo_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
      ip_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(photo_id, ip_hash)
    );

    CREATE INDEX IF NOT EXISTS idx_photo_views_photo ON photo_views(photo_id);
  `);

  // Migration: add file_size_bytes if it doesn't exist yet
  try {
    db.exec("ALTER TABLE photos ADD COLUMN file_size_bytes INTEGER DEFAULT 0");
  } catch {
    // Column already exists — safe to ignore
  }
}

export interface Photo {
  id: number;
  filename: string;
  path: string;
  width: number;
  height: number;
  thumbnail_path: string;
  thumbnail_large_path: string;
  blur_data_url: string;
  album_id: number | null;
  exif_json: string;
  file_size_bytes: number;
  created_at: string;
}

export interface Album {
  id: number;
  name: string;
  slug: string;
  description: string;
  cover_photo_id: number | null;
  created_at: string;
}

export function getPhotos(albumId?: number, limit?: number, offset?: number): Photo[] {
  const db = getDb();
  let query = albumId
    ? "SELECT * FROM photos WHERE album_id = ? ORDER BY created_at DESC"
    : "SELECT * FROM photos ORDER BY created_at DESC";

  const params: unknown[] = albumId ? [albumId] : [];

  if (limit) {
    query += " LIMIT ?";
    params.push(limit);
    if (offset) {
      query += " OFFSET ?";
      params.push(offset);
    }
  }

  return db.prepare(query).all(...params) as Photo[];
}

export function getPhotoCount(albumId?: number): number {
  const db = getDb();
  if (albumId) {
    return (db.prepare("SELECT COUNT(*) as count FROM photos WHERE album_id = ?").get(albumId) as { count: number }).count;
  }
  return (db.prepare("SELECT COUNT(*) as count FROM photos").get() as { count: number }).count;
}

export function getPhoto(id: number): Photo | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM photos WHERE id = ?").get(id) as Photo | undefined;
}

export function createPhoto(photo: Omit<Photo, "id" | "created_at">): Photo {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO photos (filename, path, width, height, thumbnail_path, thumbnail_large_path, blur_data_url, album_id, exif_json, file_size_bytes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const result = stmt.run(
    photo.filename,
    photo.path,
    photo.width,
    photo.height,
    photo.thumbnail_path,
    photo.thumbnail_large_path,
    photo.blur_data_url,
    photo.album_id,
    photo.exif_json,
    photo.file_size_bytes || 0
  );
  return getPhoto(result.lastInsertRowid as number)!;
}

export function photoExistsByPath(filePath: string): boolean {
  const db = getDb();
  const row = db.prepare("SELECT id FROM photos WHERE path = ?").get(filePath);
  return !!row;
}

export function updatePhoto(id: number, updates: Partial<Pick<Photo, "album_id" | "filename">>): Photo | undefined {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (updates.album_id !== undefined) {
    sets.push("album_id = ?");
    values.push(updates.album_id);
  }
  if (updates.filename !== undefined) {
    sets.push("filename = ?");
    values.push(updates.filename);
  }

  if (sets.length === 0) return getPhoto(id);

  values.push(id);
  db.prepare(`UPDATE photos SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return getPhoto(id);
}

export function deletePhoto(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM photos WHERE id = ?").run(id);
}

export function getAlbums(): (Album & { photo_count: number })[] {
  const db = getDb();
  return db.prepare(`
    SELECT a.*, COUNT(p.id) as photo_count
    FROM albums a
    LEFT JOIN photos p ON p.album_id = a.id
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `).all() as (Album & { photo_count: number })[];
}

export function getAlbum(slug: string): Album | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM albums WHERE slug = ?").get(slug) as Album | undefined;
}

export function getAlbumById(id: number): Album | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM albums WHERE id = ?").get(id) as Album | undefined;
}

export function createAlbum(album: { name: string; slug: string; description?: string }): Album {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO albums (name, slug, description) VALUES (?, ?, ?)"
  );
  const result = stmt.run(album.name, album.slug, album.description || "");
  return getAlbumById(result.lastInsertRowid as number)!;
}

export function updateAlbumCover(albumId: number, photoId: number): void {
  const db = getDb();
  db.prepare("UPDATE albums SET cover_photo_id = ? WHERE id = ?").run(photoId, albumId);
}

export function getPhotosWithoutSize(): Pick<Photo, "id" | "path">[] {
  const db = getDb();
  return db.prepare("SELECT id, path FROM photos WHERE file_size_bytes = 0 OR file_size_bytes IS NULL").all() as Pick<Photo, "id" | "path">[];
}

export function updatePhotoSize(id: number, fileSizeBytes: number): void {
  const db = getDb();
  db.prepare("UPDATE photos SET file_size_bytes = ? WHERE id = ?").run(fileSizeBytes, id);
}

export function recordPhotoView(photoId: number, ipHash: string): void {
  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO photo_views (photo_id, ip_hash) VALUES (?, ?)").run(photoId, ipHash);
}

export function getPhotoViewCounts(): Record<number, number> {
  const db = getDb();
  const rows = db.prepare(
    "SELECT photo_id, COUNT(*) as count FROM photo_views GROUP BY photo_id"
  ).all() as { photo_id: number; count: number }[];
  return Object.fromEntries(rows.map((r) => [r.photo_id, r.count]));
}

export function getTopViewedPhotos(limit: number = 10): { photo_id: number; filename: string; path: string; thumbnail_path: string; views: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT pv.photo_id, p.filename, p.path, p.thumbnail_path, COUNT(*) as views
    FROM photo_views pv
    JOIN photos p ON p.id = pv.photo_id
    GROUP BY pv.photo_id
    ORDER BY views DESC
    LIMIT ?
  `).all(limit) as { photo_id: number; filename: string; path: string; thumbnail_path: string; views: number }[];
}
