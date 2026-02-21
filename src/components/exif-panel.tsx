"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ExifData } from "@/lib/exif";

interface ExifPanelProps {
  exif: ExifData;
  filename: string;
}

function LocationMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const [placeName, setPlaceName] = useState<string | null>(null);

  useEffect(() => {
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
      { headers: { "Accept-Language": "en" } }
    )
      .then((r) => r.json())
      .then((data) => {
        const addr = data.address ?? {};
        const parts = [
          addr.city || addr.town || addr.village || addr.county,
          addr.state || addr.region,
          addr.country,
        ].filter(Boolean);
        setPlaceName(parts.join(", ") || data.display_name || null);
      })
      .catch(() => {});
  }, [latitude, longitude]);

  const delta = 0.008;
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ]
    .map((n) => n.toFixed(6))
    .join(",");

  const embedUrl =
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${bbox}&layer=mapnik&marker=${latitude.toFixed(6)},${longitude.toFixed(6)}`;

  const fullUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=14/${latitude}/${longitude}`;

  return (
    <div className="space-y-2">
      {placeName && (
        <div>
          <p className="text-xs text-muted-foreground">Location</p>
          <p className="font-medium text-sm">{placeName}</p>
        </div>
      )}
      <div>
        <p className="text-xs text-muted-foreground">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
      </div>
      <div className="overflow-hidden rounded-md border">
        <iframe
          src={embedUrl}
          width="100%"
          height="180"
          className="border-0 block"
          loading="lazy"
          title="Photo location"
        />
      </div>
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary hover:underline"
      >
        Open in OpenStreetMap ↗
      </a>
    </div>
  );
}

export function ExifPanel({ exif, filename }: ExifPanelProps) {
  const hasData = exif.camera || exif.lens || exif.aperture || exif.iso;

  return (
    <div className="w-72 shrink-0 overflow-y-auto bg-background/95 p-4 text-sm">
      <h3 className="mb-3 font-semibold">Photo Info</h3>
      <p className="mb-3 text-xs text-muted-foreground break-all">{filename}</p>

      {!hasData && !exif.gps && (
        <p className="text-xs text-muted-foreground">No EXIF data available.</p>
      )}

      {hasData && (
        <div className="space-y-3">
          {exif.camera && (
            <div>
              <p className="text-xs text-muted-foreground">Camera</p>
              <p className="font-medium">{exif.camera}</p>
            </div>
          )}
          {exif.lens && (
            <div>
              <p className="text-xs text-muted-foreground">Lens</p>
              <p className="font-medium">{exif.lens}</p>
            </div>
          )}

          <Separator />

          <div className="flex flex-wrap gap-2">
            {exif.aperture && <Badge variant="secondary">{exif.aperture}</Badge>}
            {exif.shutterSpeed && <Badge variant="secondary">{exif.shutterSpeed}</Badge>}
            {exif.iso && <Badge variant="secondary">{exif.iso}</Badge>}
            {exif.focalLength && <Badge variant="secondary">{exif.focalLength}</Badge>}
          </div>

          {exif.dateTaken && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Date Taken</p>
                <p className="font-medium">
                  {new Date(exif.dateTaken).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {exif.gps && (
        <>
          {hasData && <Separator className="my-3" />}
          <LocationMap
            latitude={exif.gps.latitude}
            longitude={exif.gps.longitude}
          />
        </>
      )}
    </div>
  );
}
