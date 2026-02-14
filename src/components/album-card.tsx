"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AlbumCardProps {
  album: {
    id: number;
    name: string;
    slug: string;
    description: string;
    cover_photo_id: number | null;
    photo_count: number;
  };
  coverUrl?: string;
}

export function AlbumCard({ album, coverUrl }: AlbumCardProps) {
  return (
    <Link href={`/albums/${album.slug}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-[4/3] bg-muted">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={album.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold">{album.name}</h3>
          {album.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {album.description}
            </p>
          )}
          <Badge variant="secondary" className="mt-2">
            {album.photo_count} photo{album.photo_count !== 1 ? "s" : ""}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
