import { getPhotos } from "@/lib/db";
import { PhotoGrid } from "@/components/photo-grid";

export const dynamic = "force-dynamic";

export default function GalleryPage() {
  const photos = getPhotos();

  return (
    <div className="px-2 py-4 sm:px-4 sm:py-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-light uppercase tracking-widest">Gallery</h1>
      </div>
      <PhotoGrid photos={photos} />
    </div>
  );
}
