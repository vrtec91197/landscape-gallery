import { getPhotos, getPhotoCount } from "@/lib/db";
import { GalleryClient } from "@/components/gallery-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

export default function GalleryPage() {
  const photos = getPhotos(undefined, PAGE_SIZE, 0);
  const total = getPhotoCount();

  return (
    <div className="px-2 py-4 sm:px-4 sm:py-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-light uppercase tracking-widest">Gallery</h1>
      </div>
      <GalleryClient initialPhotos={photos} total={total} pageSize={PAGE_SIZE} />
    </div>
  );
}
