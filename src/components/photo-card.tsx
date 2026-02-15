"use client";

import Image from "next/image";
import type { Photo } from "@/lib/db";

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
  priority?: boolean;
}

export function PhotoCard({ photo, onClick, priority = false }: PhotoCardProps) {
  const aspectRatio = photo.width && photo.height ? photo.width / photo.height : 4 / 3;

  return (
    <div
      className="group cursor-pointer overflow-hidden break-inside-avoid mb-2"
      onClick={onClick}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio }}>
        <Image
          src={photo.thumbnail_large_path || photo.thumbnail_path || photo.path}
          alt={photo.filename}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-all duration-500 group-hover:scale-[1.03] group-hover:opacity-90"
          quality={80}
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          {...(photo.blur_data_url
            ? { placeholder: "blur" as const, blurDataURL: photo.blur_data_url }
            : {})}
        />
      </div>
    </div>
  );
}
