import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAlbum, getPhotos, getPhotoViewCounts } from "@/lib/db";
import { PhotoGrid } from "@/components/photo-grid";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const album = getAlbum(slug);
  if (!album) return {};

  const title = album.name;
  const description = album.description
    ? album.description
    : `Landscape photos in the ${album.name} album.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Landscape Gallery`,
      description,
    },
  };
}

export default async function AlbumDetailPage({ params }: Props) {
  const { slug } = await params;
  const album = getAlbum(slug);

  if (!album) {
    notFound();
  }

  const photos = getPhotos(album.id);
  const viewCounts = getPhotoViewCounts();

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
      <PhotoGrid photos={photos} viewCounts={viewCounts} />
    </div>
  );
}
