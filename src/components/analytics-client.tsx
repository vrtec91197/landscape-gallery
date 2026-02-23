"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnalyticsSummary, DailyViews } from "@/lib/analytics";

type AnalyticsData = AnalyticsSummary & { viewsOverTime: DailyViews[] };

const PRESETS = [
  { label: "Today", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
] as const;

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

function DataTable({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  if (items.length === 0) {
    return (
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">No data yet</p>
      </div>
    );
  }

  const max = items[0]?.count || 1;

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate">{item.name || "(direct)"}</span>
                <span className="ml-2 shrink-0 text-muted-foreground">{item.count}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }: { data: DailyViews[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet</p>;
  }

  const max = Math.max(...data.map((d) => d.views), 1);

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Views Over Time
      </h3>
      <div className="flex items-end gap-1" style={{ height: 160 }}>
        {data.map((d) => (
          <div key={d.date} className="group relative flex flex-1 flex-col items-center">
            <div className="absolute -top-6 hidden rounded bg-popover px-2 py-1 text-xs shadow group-hover:block">
              {d.views} views
              <br />
              {d.date}
            </div>
            <div
              className="w-full rounded-t bg-primary transition-colors hover:bg-primary/80"
              style={{
                height: `${(d.views / max) * 140}px`,
                minHeight: d.views > 0 ? 4 : 0,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export function AnalyticsClient() {
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = useCustom && customFrom && customTo
        ? `/api/analytics?from=${customFrom}&to=${customTo}`
        : `/api/analytics?days=${selectedDays}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load analytics");
      setData(await res.json());
    } catch {
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, [selectedDays, useCustom, customFrom, customTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePreset = (days: number) => {
    setUseCustom(false);
    setSelectedDays(days);
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      setUseCustom(true);
    }
  };

  const rangeLabel = useCustom && customFrom && customTo
    ? `${customFrom} → ${customTo}`
    : `Last ${selectedDays === 1 ? "24 hours" : `${selectedDays} days`}`;

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex gap-1">
          {PRESETS.map((p) => (
            <Button
              key={p.days}
              size="sm"
              variant="outline"
              className={cn(
                !useCustom && selectedDays === p.days && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={() => handlePreset(p.days)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">From</label>
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">To</label>
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={!customFrom || !customTo}
            onClick={handleCustomApply}
            className={cn(useCustom && "bg-primary text-primary-foreground hover:bg-primary/90")}
          >
            Apply
          </Button>
        </div>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">{rangeLabel}</p>

      {loading && (
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          Loading…
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {data && !loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Views" value={data.totalViews} />
            <StatCard label="Unique Visitors" value={data.uniqueVisitors} />
            <StatCard label="Views Today" value={data.viewsToday} />
            <StatCard label="Views (7 days)" value={data.views7d} />
          </div>

          <Card className="mt-8">
            <CardContent className="p-6">
              <BarChart data={data.viewsOverTime} />
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <div className="grid gap-8 sm:grid-cols-2">
            <Card><CardContent className="p-6"><DataTable title="Top Pages" items={data.topPages} /></CardContent></Card>
            <Card><CardContent className="p-6"><DataTable title="Top Referrers" items={data.topReferrers} /></CardContent></Card>
            <Card><CardContent className="p-6"><DataTable title="Browsers" items={data.topBrowsers} /></CardContent></Card>
            <Card><CardContent className="p-6"><DataTable title="Devices" items={data.topDevices} /></CardContent></Card>
            {data.topCountries.length > 0 && (
              <Card><CardContent className="p-6"><DataTable title="Countries" items={data.topCountries} /></CardContent></Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
