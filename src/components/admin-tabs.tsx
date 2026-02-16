"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface AdminTabsProps {
  analyticsContent: ReactNode;
  photosContent: ReactNode;
}

export function AdminTabs({ analyticsContent, photosContent }: AdminTabsProps) {
  const [tab, setTab] = useState<"analytics" | "photos">("analytics");

  return (
    <>
      <div className="mt-6 flex gap-2">
        <Button
          variant={tab === "analytics" ? "default" : "outline"}
          onClick={() => setTab("analytics")}
        >
          Analytics
        </Button>
        <Button
          variant={tab === "photos" ? "default" : "outline"}
          onClick={() => setTab("photos")}
        >
          Photos
        </Button>
      </div>
      <div className="mt-6">
        {tab === "analytics" ? analyticsContent : photosContent}
      </div>
    </>
  );
}
