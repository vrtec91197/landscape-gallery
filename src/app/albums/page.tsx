import { getAlbums, getPhoto } from "@/lib/db";
import { AlbumCard } from "@/components/album-card";
import { CreateAlbumButton } from "@/components/create-album-button";

export const dynamic = "force-dynamic";

export default function AlbumsPage() {
  const albums = getAlbums();

  const albumsWithCovers = albums.map((album) => {
    let coverUrl: string | undefined;
    if (album.cover_photo_id) {
      const coverPhoto = getPhoto(album.cover_photo_id);
      coverUrl = coverPhoto?.thumbnail_path || coverPhoto?.path;
    }
    return { ...album, coverUrl };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Albums</h1>
          <p className="mt-2 text-muted-foreground">
            {albums.length} album{albums.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateAlbumButton />
      </div>

      {albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg text-muted-foreground">No albums yet</p>
          <p className="text-sm text-muted-foreground">
            Create an album to organize your photos.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albumsWithCovers.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              coverUrl={album.coverUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
