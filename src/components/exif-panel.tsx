"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ExifData } from "@/lib/exif";

interface ExifPanelProps {
  exif: ExifData;
  filename: string;
}

export function ExifPanel({ exif, filename }: ExifPanelProps) {
  const hasData = exif.camera || exif.lens || exif.aperture || exif.iso;

  return (
    <div className="w-72 shrink-0 overflow-y-auto bg-background/95 p-4 text-sm">
      <h3 className="mb-3 font-semibold">Photo Info</h3>
      <p className="mb-3 text-xs text-muted-foreground break-all">{filename}</p>

      {!hasData && (
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

          {exif.gps && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">GPS Location</p>
                <p className="font-medium">
                  {exif.gps.latitude.toFixed(4)}, {exif.gps.longitude.toFixed(4)}
                </p>
                <a
                  href={`https://www.google.com/maps?q=${exif.gps.latitude},${exif.gps.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View on Map
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
