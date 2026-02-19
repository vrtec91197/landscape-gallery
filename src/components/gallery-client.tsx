"use client";

import { useState, useCallback } from "react";
import type { Photo } from "@/lib/db";
import { PhotoGrid } from "./photo-grid";
import { Button } from "@/components/ui/button";

interface GalleryClientProps {
  initialPhotos: Photo[];
  total: number;
  pageSize: number;
  viewCounts?: Record<number, number>;
}

export function GalleryClient({ initialPhotos, total, pageSize, viewCounts }: GalleryClientProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [loading, setLoading] = useState(false);
  const hasMore = photos.length < total;

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/photos?limit=${pageSize}&offset=${photos.length}`);
      const data = await res.json();
      setPhotos((prev) => [...prev, ...data.photos]);
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      setLoading(false);
    }
  }, [photos.length, pageSize]);

  return (
    <>
      <PhotoGrid photos={photos} viewCounts={viewCounts} />
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </>
  );
}
