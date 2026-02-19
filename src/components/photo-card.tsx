"use client";

import Image from "next/image";
import type { Photo } from "@/lib/db";

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
  priority?: boolean;
  viewCount?: number;
}

export function PhotoCard({ photo, onClick, priority = false, viewCount }: PhotoCardProps) {
  const aspectRatio = photo.width && photo.height ? photo.width / photo.height : 4 / 3;

  return (
    <div
      className="group cursor-pointer overflow-hidden break-inside-avoid mb-2 select-none"
      onClick={onClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio }}>
        <Image
          src={photo.thumbnail_large_path || photo.thumbnail_path || photo.path}
          alt={photo.filename}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-all duration-500 group-hover:scale-[1.03] group-hover:opacity-90"
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          style={{ pointerEvents: "none" }}
          {...(photo.blur_data_url
            ? { placeholder: "blur" as const, blurDataURL: photo.blur_data_url }
            : {})}
        />
        {viewCount !== undefined && viewCount > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            {viewCount}
          </div>
        )}
      </div>
    </div>
  );
}
