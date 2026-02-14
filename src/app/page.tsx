import { getPhotos } from "@/lib/db";
import { PhotoGrid } from "@/components/photo-grid";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const photos = getPhotos();
  const recentPhotos = photos.slice(0, 12);

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
        <PhotoGrid photos={recentPhotos} />
      </section>
    </div>
  );
}
