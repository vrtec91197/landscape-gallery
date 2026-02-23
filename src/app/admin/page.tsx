import { getPhotos, getAlbums } from "@/lib/db";
import { AdminTabs } from "@/components/admin-tabs";
import { AdminPhotos } from "@/components/admin-photos";
import { AnalyticsClient } from "@/components/analytics-client";
import { version } from "../../../package.json";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const photos = getPhotos();
  const albums = getAlbums();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          v{version}
        </span>
      </div>

      <AdminTabs
        analyticsContent={<AnalyticsClient />}
        photosContent={
          <AdminPhotos
            initialPhotos={photos.map((p) => ({
              id: p.id,
              filename: p.filename,
              path: p.path,
              thumbnail_path: p.thumbnail_path,
              album_id: p.album_id,
              created_at: p.created_at,
              file_size_bytes: p.file_size_bytes || 0,
            }))}
            albums={albums.map((a) => ({
              id: a.id,
              name: a.name,
              slug: a.slug,
            }))}
          />
        }
      />
    </div>
  );
}
