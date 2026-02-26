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

  // dominant_hue for color sorting
  try { db.exec("ALTER TABLE photos ADD COLUMN dominant_hue INTEGER DEFAULT NULL"); } catch {}

  // Tags
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
    CREATE TABLE IF NOT EXISTS photo_tags (
      photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (photo_id, tag_id)
    );
    CREATE INDEX IF NOT EXISTS idx_photo_tags_photo ON photo_tags(photo_id);
    CREATE INDEX IF NOT EXISTS idx_photo_tags_tag ON photo_tags(tag_id);
  `);

  // Photo view log — full metadata, no UNIQUE constraint (every view event)
  db.exec(`
    CREATE TABLE IF NOT EXISTS photo_view_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
      ip_hash TEXT NOT NULL,
      browser TEXT DEFAULT '',
      device TEXT DEFAULT '',
      country TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_pvl_photo ON photo_view_log(photo_id);
    CREATE INDEX IF NOT EXISTS idx_pvl_created ON photo_view_log(created_at);
  `);
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
  dominant_hue?: number | null;
}

export interface Album {
  id: number;
  name: string;
  slug: string;
  description: string;
  cover_photo_id: number | null;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface GetPhotosOptions {
  albumId?: number;
  limit?: number;
  offset?: number;
  sort?: 'newest' | 'oldest' | 'views' | 'color';
  tag?: string; // tag slug
}

export function getPhotos(opts: GetPhotosOptions = {}): Photo[] {
  const db = getDb();
  const { albumId, limit, offset, sort = 'newest', tag } = opts;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (albumId) {
    conditions.push("p.album_id = ?");
    params.push(albumId);
  }

  let tagJoin = "";
  if (tag) {
    tagJoin = "INNER JOIN photo_tags pt ON pt.photo_id = p.id INNER JOIN tags t ON t.id = pt.tag_id";
    conditions.push("t.slug = ?");
    params.push(tag);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderBy: string;
  switch (sort) {
    case 'oldest':
      orderBy = "p.created_at ASC";
      break;
    case 'color':
      orderBy = "CASE WHEN p.dominant_hue IS NULL THEN 1 ELSE 0 END ASC, p.dominant_hue ASC";
      break;
    case 'views':
      orderBy = "(SELECT COUNT(*) FROM photo_views WHERE photo_id = p.id) DESC, p.created_at DESC";
      break;
    default:
      orderBy = "p.created_at DESC";
  }

  let query = `SELECT p.* FROM photos p ${tagJoin} ${where} ORDER BY ${orderBy}`;

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

export function getPhotoCount(albumId?: number, tag?: string): number {
  const db = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (albumId) {
    conditions.push("p.album_id = ?");
    params.push(albumId);
  }

  let tagJoin = "";
  if (tag) {
    tagJoin = "INNER JOIN photo_tags pt ON pt.photo_id = p.id INNER JOIN tags t ON t.id = pt.tag_id";
    conditions.push("t.slug = ?");
    params.push(tag);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const query = `SELECT COUNT(*) as count FROM photos p ${tagJoin} ${where}`;
  return (db.prepare(query).get(...params) as { count: number }).count;
}

export function getPhoto(id: number): Photo | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM photos WHERE id = ?").get(id) as Photo | undefined;
}

export function createPhoto(photo: Omit<Photo, "id" | "created_at">): Photo {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO photos (filename, path, width, height, thumbnail_path, thumbnail_large_path, blur_data_url, album_id, exif_json, file_size_bytes, dominant_hue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
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
    photo.file_size_bytes || 0,
    photo.dominant_hue ?? null
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

export function updatePhotoDominantHue(id: number, hue: number | null): void {
  const db = getDb();
  db.prepare("UPDATE photos SET dominant_hue = ? WHERE id = ?").run(hue, id);
}

export function getPhotosWithoutHue(): Pick<Photo, "id" | "path">[] {
  const db = getDb();
  return db.prepare("SELECT id, path FROM photos WHERE dominant_hue IS NULL").all() as Pick<Photo, "id" | "path">[];
}

export function getTags(): Tag[] {
  const db = getDb();
  return db.prepare("SELECT * FROM tags ORDER BY name ASC").all() as Tag[];
}

export function createTag(name: string): Tag {
  const db = getDb();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const existing = db.prepare("SELECT * FROM tags WHERE slug = ?").get(slug) as Tag | undefined;
  if (existing) return existing;
  const result = db.prepare("INSERT INTO tags (name, slug) VALUES (?, ?)").run(name.trim(), slug);
  return db.prepare("SELECT * FROM tags WHERE id = ?").get(result.lastInsertRowid) as Tag;
}

export function getPhotoTags(photoId: number): Tag[] {
  const db = getDb();
  return db.prepare(
    "SELECT t.* FROM tags t INNER JOIN photo_tags pt ON pt.tag_id = t.id WHERE pt.photo_id = ? ORDER BY t.name ASC"
  ).all(photoId) as Tag[];
}

export function setPhotoTags(photoId: number, tagIds: number[]): void {
  const db = getDb();
  db.prepare("DELETE FROM photo_tags WHERE photo_id = ?").run(photoId);
  for (const tagId of tagIds) {
    db.prepare("INSERT OR IGNORE INTO photo_tags (photo_id, tag_id) VALUES (?, ?)").run(photoId, tagId);
  }
}

export interface PhotoViewer {
  ip_hash: string;
  browser: string;
  device: string;
  country: string;
  total_views: number;
  first_seen: string;
  last_seen: string;
}

export function logPhotoView(
  photoId: number,
  ipHash: string,
  browser: string,
  device: string,
  country: string
): void {
  const db = getDb();
  db.prepare(
    "INSERT INTO photo_view_log (photo_id, ip_hash, browser, device, country) VALUES (?, ?, ?, ?, ?)"
  ).run(photoId, ipHash, browser, device, country);
}

export function getPhotoViewers(photoId: number): PhotoViewer[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      ip_hash,
      browser,
      device,
      country,
      COUNT(*) as total_views,
      MIN(created_at) as first_seen,
      MAX(created_at) as last_seen
    FROM photo_view_log
    WHERE photo_id = ?
    GROUP BY ip_hash
    ORDER BY last_seen DESC
  `).all(photoId) as PhotoViewer[];
}
