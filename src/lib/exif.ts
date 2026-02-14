import exifr from "exifr";

export interface ExifData {
  camera?: string;
  lens?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  focalLength?: string;
  dateTaken?: string;
  gps?: { latitude: number; longitude: number };
}

export async function extractExif(filePath: string): Promise<ExifData> {
  try {
    const data = await exifr.parse(filePath, {
      pick: [
        "Make", "Model", "LensModel", "LensMake",
        "FNumber", "ExposureTime", "ISO", "FocalLength",
        "DateTimeOriginal", "GPSLatitude", "GPSLongitude",
      ],
      gps: true,
    });

    if (!data) return {};

    const result: ExifData = {};

    if (data.Make || data.Model) {
      const make = (data.Make || "").trim();
      const model = (data.Model || "").trim();
      result.camera = model.startsWith(make) ? model : `${make} ${model}`.trim();
    }

    if (data.LensModel) {
      result.lens = data.LensModel;
    }

    if (data.FNumber) {
      result.aperture = `f/${data.FNumber}`;
    }

    if (data.ExposureTime) {
      if (data.ExposureTime < 1) {
        result.shutterSpeed = `1/${Math.round(1 / data.ExposureTime)}s`;
      } else {
        result.shutterSpeed = `${data.ExposureTime}s`;
      }
    }

    if (data.ISO) {
      result.iso = `ISO ${data.ISO}`;
    }

    if (data.FocalLength) {
      result.focalLength = `${data.FocalLength}mm`;
    }

    if (data.DateTimeOriginal) {
      result.dateTaken = new Date(data.DateTimeOriginal).toISOString();
    }

    if (data.latitude && data.longitude) {
      result.gps = { latitude: data.latitude, longitude: data.longitude };
    }

    return result;
  } catch {
    return {};
  }
}
