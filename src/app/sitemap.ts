import type { MetadataRoute } from "next";
import { getAlbums } from "@/lib/db";

const siteUrl = process.env.DOMAIN
  ? `https://${process.env.DOMAIN}`
  : "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const albums = getAlbums();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/gallery`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/albums`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const albumRoutes: MetadataRoute.Sitemap = albums.map((album) => ({
    url: `${siteUrl}/albums/${album.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...albumRoutes];
}
