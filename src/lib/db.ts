import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "gallery.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
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
  `);
}

export interface Photo {
  id: number;
  filename: string;
  path: string;
  width: number;
  height: number;
  thumbnail_path: string;
  album_id: number | null;
  exif_json: string;
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

export function getPhotos(albumId?: number): Photo[] {
  const db = getDb();
  if (albumId) {
    return db.prepare("SELECT * FROM photos WHERE album_id = ? ORDER BY created_at DESC").all(albumId) as Photo[];
  }
  return db.prepare("SELECT * FROM photos ORDER BY created_at DESC").all() as Photo[];
}

export function getPhoto(id: number): Photo | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM photos WHERE id = ?").get(id) as Photo | undefined;
}

export function createPhoto(photo: Omit<Photo, "id" | "created_at">): Photo {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO photos (filename, path, width, height, thumbnail_path, album_id, exif_json) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const result = stmt.run(
    photo.filename,
    photo.path,
    photo.width,
    photo.height,
    photo.thumbnail_path,
    photo.album_id,
    photo.exif_json
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
