"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Album {
  id: number;
  name: string;
  slug: string;
}

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/albums")
        .then((r) => r.json())
        .then(setAlbums)
        .catch(() => {});
    }
  }, [open]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    if (selectedAlbum) formData.append("albumId", selectedAlbum);

    try {
      await fetch("/api/upload", { method: "POST", body: formData });
      setFiles([]);
      setSelectedAlbum("");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleScan = async () => {
    setUploading(true);
    try {
      const res = await fetch("/api/photos", { method: "POST" });
      const result = await res.json();
      alert(`Scan complete: ${result.added} added, ${result.skipped} skipped`);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Photos</DialogTitle>
        </DialogHeader>

        <div
          className={`flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-muted-foreground"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          <p className="text-sm text-muted-foreground">
            Drag & drop images here, or{" "}
            <label className="cursor-pointer text-primary hover:underline">
              browse
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </p>

          {files.length > 0 && (
            <div className="mt-3 text-sm">
              <p className="font-medium">{files.length} file(s) selected</p>
              <ul className="mt-1 max-h-24 overflow-y-auto text-xs text-muted-foreground">
                {files.map((f, i) => (
                  <li key={i}>{f.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {albums.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Album (optional)</label>
            <Select value={selectedAlbum} onValueChange={setSelectedAlbum}>
              <SelectTrigger>
                <SelectValue placeholder="No album" />
              </SelectTrigger>
              <SelectContent>
                {albums.map((album) => (
                  <SelectItem key={album.id} value={String(album.id)}>
                    {album.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
          >
            {uploading ? "Uploading..." : `Upload ${files.length} Photo(s)`}
          </Button>
          <Button variant="outline" onClick={handleScan} disabled={uploading}>
            Scan Folder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
