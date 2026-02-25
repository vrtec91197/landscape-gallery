"use client";

import { useState, useCallback, useEffect } from "react";
import type { Photo } from "@/lib/db";
import { PhotoGrid } from "./photo-grid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SortOption = 'newest' | 'oldest' | 'views' | 'color';

interface Tag { id: number; name: string; slug: string; }

interface GalleryClientProps {
  initialPhotos: Photo[];
  total: number;
  pageSize: number;
  viewCounts?: Record<number, number>;
}

const SORTS: { label: string; value: SortOption }[] = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Most Viewed", value: "views" },
  { label: "Color", value: "color" },
];

export function GalleryClient({ initialPhotos, total: initialTotal, pageSize, viewCounts: initialViewCounts }: GalleryClientProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [total, setTotal] = useState(initialTotal);
  const [viewCounts, setViewCounts] = useState<Record<number, number>>(initialViewCounts ?? {});
  const [sort, setSort] = useState<SortOption>('newest');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtering, setFiltering] = useState(false);

  // Fetch available tags once
  useEffect(() => {
    fetch("/api/tags").then(r => r.json()).then(setTags).catch(() => {});
  }, []);

  const buildUrl = useCallback((offset: number, currentSort: SortOption, currentTag: string | null) => {
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
      sort: currentSort,
    });
    if (currentTag) params.set("tag", currentTag);
    return `/api/photos?${params}`;
  }, [pageSize]);

  // Reload from scratch when sort or tag changes
  const applyFilter = useCallback(async (newSort: SortOption, newTag: string | null) => {
    setFiltering(true);
    try {
      const res = await fetch(buildUrl(0, newSort, newTag));
      const data = await res.json();
      setPhotos(data.photos);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load photos:", err);
    } finally {
      setFiltering(false);
    }
  }, [buildUrl]);

  const handleSort = (newSort: SortOption) => {
    setSort(newSort);
    applyFilter(newSort, activeTag);
  };

  const handleTag = (slug: string | null) => {
    const newTag = activeTag === slug ? null : slug;
    setActiveTag(newTag);
    applyFilter(sort, newTag);
  };

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(buildUrl(photos.length, sort, activeTag));
      const data = await res.json();
      setPhotos(prev => [...prev, ...data.photos]);
      // merge view counts
      setViewCounts(prev => ({ ...prev }));
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      setLoading(false);
    }
  }, [photos.length, sort, activeTag, buildUrl]);

  const hasMore = photos.length < total;

  return (
    <>
      {/* Sort controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Sort:</span>
        {SORTS.map(s => (
          <Button
            key={s.value}
            size="sm"
            variant="outline"
            className={cn(sort === s.value && "bg-primary text-primary-foreground hover:bg-primary/90")}
            onClick={() => handleSort(s.value)}
            disabled={filtering}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {/* Tag filter chips */}
      {tags.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Filter:</span>
          {tags.map(t => (
            <button
              key={t.id}
              onClick={() => handleTag(t.slug)}
              disabled={filtering}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                activeTag === t.slug
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground hover:bg-muted"
              )}
            >
              {t.name}
            </button>
          ))}
          {activeTag && (
            <button
              onClick={() => handleTag(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {filtering ? (
        <div className="flex justify-center py-24 text-sm text-muted-foreground">Loading&#8230;</div>
      ) : (
        <>
          <PhotoGrid photos={photos} viewCounts={viewCounts} />
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" size="lg" onClick={loadMore} disabled={loading}>
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
