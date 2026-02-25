import { getPhotos, getPhotoViewCounts } from "@/lib/db";
import { PhotoGrid } from "@/components/photo-grid";
import type { Photo } from "@/lib/db";

export const revalidate = 60;

export default function HomePage() {
  let photos: Photo[] = [];
  let viewCounts: Record<number, number> = {};

  try {
    photos = getPhotos({ limit: 12 });
    viewCounts = getPhotoViewCounts();
  } catch {
    // DB not available at build time
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center bg-gradient-to-b from-muted/50 to-background px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Landscape Gallery
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted-foreground">
          A curated collection of landscape photography. Upload your photos or
          scan a folder to build your gallery.
        </p>
      </section>

      {/* Recent Photos */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-semibold">Recent Photos</h2>
        <PhotoGrid photos={photos} viewCounts={viewCounts} />
      </section>
    </div>
  );
}
