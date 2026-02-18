"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface AdminTabsProps {
  analyticsContent: ReactNode;
  photosContent: ReactNode;
}

export function AdminTabs({ analyticsContent, photosContent }: AdminTabsProps) {
  const [tab, setTab] = useState<"analytics" | "photos">("analytics");
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  async function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    // Give the server component a moment to re-render
    setTimeout(() => setRefreshing(false), 800);
  }

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
        {tab === "analytics" && (
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="ml-auto"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        )}
      </div>
      <div className="mt-6">
        {tab === "analytics" ? analyticsContent : photosContent}
      </div>
    </>
  );
}
