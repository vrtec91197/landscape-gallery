"use client";

import { useState } from "react";
import type { Photo } from "@/lib/db";
import { PhotoCard } from "./photo-card";
import { Lightbox } from "./lightbox";

interface PhotoGridProps {
  photos: Photo[];
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg text-muted-foreground">No photos yet</p>
        <p className="text-sm text-muted-foreground">
          Upload photos or scan a folder to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-1 gap-2 sm:columns-2 lg:columns-3">
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => setLightboxIndex(index)}
          />
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
