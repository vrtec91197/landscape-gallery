import { getAnalyticsSummary, getViewsOverTime } from "@/lib/analytics";
import { getPhotos, getAlbums, getTopViewedPhotos } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AdminTabs } from "@/components/admin-tabs";
import { AdminPhotos } from "@/components/admin-photos";

export const dynamic = "force-dynamic";

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

function BarChart({ data }: { data: { date: string; views: number }[] }) {
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

function AnalyticsContent() {
  const summary = getAnalyticsSummary(30);
  const viewsOverTime = getViewsOverTime(30);
  const topPhotos = getTopViewedPhotos(10);

  return (
    <>
      <p className="text-muted-foreground">Last 30 days</p>

      {/* Stat Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Views Today" value={summary.viewsToday} />
        <StatCard label="Views (7 days)" value={summary.views7d} />
        <StatCard label="Views (30 days)" value={summary.views30d} />
        <StatCard label="Unique Visitors" value={summary.uniqueVisitors} />
      </div>

      {/* Chart */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <BarChart data={viewsOverTime} />
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Data Tables */}
      <div className="grid gap-8 sm:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <DataTable title="Top Pages" items={summary.topPages} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <DataTable title="Top Referrers" items={summary.topReferrers} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <DataTable title="Browsers" items={summary.topBrowsers} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <DataTable title="Devices" items={summary.topDevices} />
          </CardContent>
        </Card>
        {summary.topCountries.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <DataTable title="Countries" items={summary.topCountries} />
            </CardContent>
          </Card>
        )}
      </div>

      {topPhotos.length > 0 && (
        <>
          <Separator className="my-8" />
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Most Viewed Photos
              </h3>
              <div className="space-y-3">
                {topPhotos.map((photo, i) => (
                  <div key={photo.photo_id} className="flex items-center gap-3">
                    <span className="w-5 shrink-0 text-sm text-muted-foreground">{i + 1}.</span>
                    {photo.thumbnail_path && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.thumbnail_path}
                        alt={photo.filename}
                        className="h-10 w-10 rounded object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{photo.filename}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      {photo.views}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}

export default function AdminPage() {
  const photos = getPhotos();
  const albums = getAlbums();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <AdminTabs
        analyticsContent={<AnalyticsContent />}
        photosContent={
          <AdminPhotos
            initialPhotos={photos.map((p) => ({
              id: p.id,
              filename: p.filename,
              path: p.path,
              thumbnail_path: p.thumbnail_path,
              album_id: p.album_id,
              created_at: p.created_at,
            }))}
            albums={albums.map((a) => ({
              id: a.id,
              name: a.name,
              slug: a.slug,
            }))}
          />
        }
      />
    </div>
  );
}
