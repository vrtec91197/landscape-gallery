"use client";

import Image from "next/image";
import type { Photo } from "@/lib/db";

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
}

export function PhotoCard({ photo, onClick }: PhotoCardProps) {
  const aspectRatio = photo.width && photo.height ? photo.width / photo.height : 4 / 3;

  return (
    <div
      className="group cursor-pointer overflow-hidden break-inside-avoid mb-2"
      onClick={onClick}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio }}>
        <Image
          src={photo.thumbnail_path || photo.path}
          alt={photo.filename}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-all duration-500 group-hover:scale-[1.03] group-hover:opacity-90"
          loading="lazy"
        />
      </div>
    </div>
  );
}
