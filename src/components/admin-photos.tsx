"use client";

import { useState, useMemo } from "react";
import { Trash2, Pencil, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortKey = "date_desc" | "date_asc" | "name_asc" | "name_desc" | "size_desc" | "size_asc";

interface Photo {
  id: number;
  filename: string;
  path: string;
  thumbnail_path: string;
  album_id: number | null;
  created_at: string;
  file_size_bytes: number;
}

interface Album {
  id: number;
  name: string;
  slug: string;
}

interface AdminPhotosProps {
  initialPhotos: Photo[];
  albums: Album[];
}

export function AdminPhotos({ initialPhotos, albums }: AdminPhotosProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [sortKey, setSortKey] = useState<SortKey>("date_desc");
  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null);
  const [editTarget, setEditTarget] = useState<Photo | null>(null);
  const [editFilename, setEditFilename] = useState("");
  const [editAlbumId, setEditAlbumId] = useState<string>("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [viewersTarget, setViewersTarget] = useState<Photo | null>(null);
  const [viewers, setViewers] = useState<{ ip_hash: string; browser: string; device: string; country: string; total_views: number; first_seen: string; last_seen: string }[]>([]);
  const [viewersLoading, setViewersLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ added: number; skipped: number; backfilled: number; exifBackfilled: number; hueBackfilled: number } | null>(null);

  async function handleScan() {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/photos", { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        setScanResult(result);
        // Reload photos list to pick up newly scanned photos + updated sizes
        const photosRes = await fetch("/api/photos");
        if (photosRes.ok) {
          const data = await photosRes.json();
          setPhotos(data.photos);
        }
      }
    } finally {
      setScanning(false);
    }
  }

  async function openEdit(photo: Photo) {
    setEditTarget(photo);
    setEditFilename(photo.filename);
    setEditAlbumId(photo.album_id ? String(photo.album_id) : "none");
    setEditTags([]);
    setTagInput("");
    const res = await fetch(`/api/tags?photoId=${photo.id}`);
    if (res.ok) {
      const tags = await res.json();
      setEditTags(tags.map((t: { name: string }) => t.name));
    }
  }

  async function openViewers(photo: Photo) {
    setViewersTarget(photo);
    setViewers([]);
    setViewersLoading(true);
    try {
      const res = await fetch(`/api/photos/viewers?photoId=${photo.id}`);
      if (res.ok) setViewers(await res.json());
    } finally {
      setViewersLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/photos?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      }
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  }

  async function handleEdit() {
    if (!editTarget) return;
    setLoading(true);
    try {
      const body: Record<string, unknown> = { id: editTarget.id };
      if (editFilename !== editTarget.filename) {
        body.filename = editFilename;
      }
      const newAlbumId = editAlbumId === "none" ? null : parseInt(editAlbumId);
      if (newAlbumId !== editTarget.album_id) {
        body.album_id = newAlbumId;
      }
      body.tags = editTags;

      const res = await fetch("/api/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setPhotos((prev) =>
          prev.map((p) => (p.id === editTarget.id ? { ...p, ...updated } : p))
        );
      }
    } finally {
      setLoading(false);
      setEditTarget(null);
    }
  }

  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
      switch (sortKey) {
        case "name_asc":  return a.filename.localeCompare(b.filename);
        case "name_desc": return b.filename.localeCompare(a.filename);
        case "size_desc": return b.file_size_bytes - a.file_size_bytes;
        case "size_asc":  return a.file_size_bytes - b.file_size_bytes;
        case "date_asc":  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "date_desc":
        default:          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [photos, sortKey]);

  function formatSize(bytes: number) {
    if (!bytes) return "—";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function albumName(albumId: number | null) {
    if (!albumId) return "No album";
    return albums.find((a) => a.id === albumId)?.name || "Unknown";
  }

  if (photos.length === 0) {
    return (
      <p className="mt-8 text-center text-muted-foreground">No photos found.</p>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">{photos.length} photos</span>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Date (newest first)</SelectItem>
            <SelectItem value="date_asc">Date (oldest first)</SelectItem>
            <SelectItem value="name_asc">Name A &#8594; Z</SelectItem>
            <SelectItem value="name_desc">Name Z &#8594; A</SelectItem>
            <SelectItem value="size_desc">Size (largest first)</SelectItem>
            <SelectItem value="size_asc">Size (smallest first)</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={handleScan}
          disabled={scanning}
          className="ml-auto"
        >
          {scanning ? "Scanning\u2026" : "Scan for new photos"}
        </Button>
        {scanResult && (
          <span className="text-sm text-muted-foreground">
            {scanResult.added} added, {scanResult.skipped} skipped
            {scanResult.backfilled > 0 && `, ${scanResult.backfilled} sizes updated`}
            {scanResult.exifBackfilled > 0 && `, ${scanResult.exifBackfilled} EXIF updated`}
            {scanResult.hueBackfilled > 0 && `, ${scanResult.hueBackfilled} colors updated`}
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {sortedPhotos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden">
            <div className="group relative aspect-square bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbnail_path}
                alt={photo.filename}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="absolute inset-0 flex items-start justify-end gap-1 bg-black/0 p-2 opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  title="View audience"
                  onClick={() => openViewers(photo)}
                >
                  <Users className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(photo)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDeleteTarget(photo)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardContent className="p-3">
              <p className="truncate text-sm font-medium">{photo.filename}</p>
              <p className="text-xs text-muted-foreground">
                {albumName(photo.album_id)}
              </p>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(photo.created_at).toLocaleDateString()}</span>
                <span className="font-mono">{formatSize(photo.file_size_bytes)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Photo</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.filename}
              &rdquo;? This will permanently remove the photo and its thumbnails
              from disk.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Viewers Dialog */}
      <Dialog open={!!viewersTarget} onOpenChange={(open) => !open && setViewersTarget(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Viewers — {viewersTarget?.filename}</DialogTitle>
            <DialogDescription>
              Unique visitors who viewed this photo, grouped by browser fingerprint.
            </DialogDescription>
          </DialogHeader>
          {viewersLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : viewers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No views recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-4">Visitor</th>
                    <th className="pb-2 pr-4">Browser</th>
                    <th className="pb-2 pr-4">Device</th>
                    <th className="pb-2 pr-4">Country</th>
                    <th className="pb-2 pr-4 text-right">Views</th>
                    <th className="pb-2 pr-4">First Seen</th>
                    <th className="pb-2">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {viewers.map((v) => (
                    <tr key={v.ip_hash} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{v.ip_hash.substring(0, 8)}</td>
                      <td className="py-2 pr-4">{v.browser || "—"}</td>
                      <td className="py-2 pr-4">{v.device || "—"}</td>
                      <td className="py-2 pr-4">{v.country || "—"}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{v.total_views}</td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">{new Date(v.first_seen).toLocaleString()}</td>
                      <td className="py-2 text-xs text-muted-foreground">{new Date(v.last_seen).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewersTarget(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
            <DialogDescription>
              Update the filename, album assignment, or tags for this photo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-filename">Filename</Label>
              <Input
                id="edit-filename"
                value={editFilename}
                onChange={(e) => setEditFilename(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Album</Label>
              <Select value={editAlbumId} onValueChange={setEditAlbumId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select album" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No album</SelectItem>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={String(album.id)}>
                      {album.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1 min-h-8">
                {editTags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {tag}
                    <button type="button" onClick={() => setEditTags(prev => prev.filter(t => t !== tag))} className="text-muted-foreground hover:text-foreground">&times;</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                      e.preventDefault();
                      const tag = tagInput.trim().replace(/,$/, '');
                      if (tag && !editTags.includes(tag)) setEditTags(prev => [...prev, tag]);
                      setTagInput('');
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  const tag = tagInput.trim();
                  if (tag && !editTags.includes(tag)) setEditTags(prev => [...prev, tag]);
                  setTagInput('');
                }}>Add</Button>
              </div>
              <p className="text-xs text-muted-foreground">Press Enter or comma to add a tag</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
