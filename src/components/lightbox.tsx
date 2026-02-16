"use client";

import { useEffect, useCallback, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ExifPanel } from "./exif-panel";
import type { Photo } from "@/lib/db";
import type { ExifData } from "@/lib/exif";

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({ photos, currentIndex, onClose, onNavigate }: LightboxProps) {
  const [showExif, setShowExif] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const photo = photos[currentIndex];

  // Reset loaded state on navigation
  useEffect(() => {
    setLoaded(false);
  }, [currentIndex]);

  const exif: ExifData = (() => {
    try {
      return JSON.parse(photo.exif_json);
    } catch {
      return {};
    }
  })();

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
  }, [currentIndex, photos.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, onNavigate]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowRight":
          goNext();
          break;
        case "ArrowLeft":
          goPrev();
          break;
        case "i":
          setShowExif((prev) => !prev);
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  return (
    <div className="fixed inset-0 z-50 flex bg-black/95" onClick={onClose}>
      <div className="flex flex-1 items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {/* Nav buttons */}
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 z-10 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
            onClick={goPrev}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Button>
        )}

        {currentIndex < photos.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 z-10 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
            style={showExif ? { right: "19rem" } : {}}
            onClick={goNext}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </Button>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 text-white">
          <span className="text-sm">
            {currentIndex + 1} / {photos.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => setShowExif(!showExif)}
            >
              {showExif ? "Hide" : "Show"} Info
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </Button>
          </div>
        </div>

        {/* Image */}
        <div className="relative h-[calc(100vh-8rem)] w-full">
          {/* Loading spinner */}
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            </div>
          )}
          <Image
            src={photo.path}
            alt={photo.filename}
            fill
            unoptimized
            className={`object-contain transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
            sizes="100vw"
            priority
            onLoad={() => setLoaded(true)}
            {...(photo.blur_data_url
              ? { placeholder: "blur" as const, blurDataURL: photo.blur_data_url }
              : {})}
          />
        </div>
      </div>

      {/* EXIF Panel */}
      {showExif && (
        <div onClick={(e) => e.stopPropagation()}>
          <ExifPanel exif={exif} filename={photo.filename} />
        </div>
      )}
    </div>
  );
}
