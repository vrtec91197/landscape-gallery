"use client";

import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
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

interface Photo {
  id: number;
  filename: string;
  path: string;
  thumbnail_path: string;
  album_id: number | null;
  created_at: string;
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
  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null);
  const [editTarget, setEditTarget] = useState<Photo | null>(null);
  const [editFilename, setEditFilename] = useState("");
  const [editAlbumId, setEditAlbumId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  function openEdit(photo: Photo) {
    setEditTarget(photo);
    setEditFilename(photo.filename);
    setEditAlbumId(photo.album_id ? String(photo.album_id) : "none");
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
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
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
              <p className="text-xs text-muted-foreground">
                {new Date(photo.created_at).toLocaleDateString()}
              </p>
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

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
            <DialogDescription>
              Update the filename or album assignment for this photo.
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
