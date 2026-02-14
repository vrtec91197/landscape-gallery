import { notFound } from "next/navigation";
import { getAlbum, getPhotos } from "@/lib/db";
import { PhotoGrid } from "@/components/photo-grid";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AlbumDetailPage({ params }: Props) {
  const { slug } = await params;
  const album = getAlbum(slug);

  if (!album) {
    notFound();
  }

  const photos = getPhotos(album.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{album.name}</h1>
        {album.description && (
          <p className="mt-2 text-muted-foreground">{album.description}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {photos.length} photo{photos.length !== 1 ? "s" : ""}
        </p>
      </div>
      <PhotoGrid photos={photos} />
    </div>
  );
}
