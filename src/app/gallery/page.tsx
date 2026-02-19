import type { Metadata } from "next";
import { getPhotos, getPhotoCount, getPhotoViewCounts } from "@/lib/db";
import { GalleryClient } from "@/components/gallery-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Browse the full landscape photography collection.",
  openGraph: {
    title: "Gallery | Landscape Gallery",
    description: "Browse the full landscape photography collection.",
  },
};

const PAGE_SIZE = 30;

export default function GalleryPage() {
  const photos = getPhotos(undefined, PAGE_SIZE, 0);
  const total = getPhotoCount();
  const viewCounts = getPhotoViewCounts();

  return (
    <div className="px-2 py-4 sm:px-4 sm:py-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-light uppercase tracking-widest">Gallery</h1>
      </div>
      <GalleryClient initialPhotos={photos} total={total} pageSize={PAGE_SIZE} viewCounts={viewCounts} />
    </div>
  );
}
