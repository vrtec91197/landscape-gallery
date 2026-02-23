import { createHash } from "crypto";
import { getDb } from "./db";

export interface PageViewInput {
  path: string;
  referrer: string;
  userAgent: string;
  ip: string;
  country?: string;
}

function hashIp(ip: string, userAgent: string): string {
  return createHash("sha256").update(`${ip}:${userAgent}`).digest("hex").substring(0, 16);
}

function parseBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  if (/Opera|OPR\//i.test(ua)) return "Opera";
  return "Other";
}

function parseDevice(ua: string): string {
  if (/Mobile|Android.*Mobile|iPhone|iPod/i.test(ua)) return "Mobile";
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) return "Tablet";
  return "Desktop";
}

export function recordPageView(input: PageViewInput): void {
  const db = getDb();
  const ipHash = hashIp(input.ip, input.userAgent);
  const browser = parseBrowser(input.userAgent);
  const device = parseDevice(input.userAgent);

  db.prepare(
    "INSERT INTO page_views (path, referrer, user_agent, ip_hash, country, browser, device) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(input.path, input.referrer, input.userAgent, ipHash, input.country || "", browser, device);
}

interface TopItem {
  name: string;
  count: number;
}

export interface AnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  viewsToday: number;
  views7d: number;
  views30d: number;
  topPages: TopItem[];
  topReferrers: TopItem[];
  topBrowsers: TopItem[];
  topDevices: TopItem[];
  topCountries: TopItem[];
}

export interface AnalyticsOptions {
  days?: number;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

function toSQLite(d: Date): string {
  return d.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
}

function resolveDateRange(opts: AnalyticsOptions): [string, string] {
  if (opts.from && opts.to) {
    return [`${opts.from} 00:00:00`, `${opts.to} 23:59:59`];
  }
  const now = new Date();
  const days = opts.days ?? 30;
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return [toSQLite(since), toSQLite(now)];
}

export function getAnalyticsSummary(opts: AnalyticsOptions = {}): AnalyticsSummary {
  const db = getDb();
  const [since, until] = resolveDateRange(opts);

  const totalViews = (db.prepare(
    "SELECT COUNT(*) as count FROM page_views WHERE created_at >= ? AND created_at <= ?"
  ).get(since, until) as { count: number }).count;

  const uniqueVisitors = (db.prepare(
    "SELECT COUNT(DISTINCT ip_hash) as count FROM page_views WHERE created_at >= ? AND created_at <= ?"
  ).get(since, until) as { count: number }).count;

  const viewsToday = (db.prepare(
    "SELECT COUNT(*) as count FROM page_views WHERE created_at >= datetime('now', 'start of day')"
  ).get() as { count: number }).count;

  const views7d = (db.prepare(
    "SELECT COUNT(*) as count FROM page_views WHERE created_at >= datetime('now', '-7 days')"
  ).get() as { count: number }).count;

  const views30d = (db.prepare(
    "SELECT COUNT(*) as count FROM page_views WHERE created_at >= datetime('now', '-30 days')"
  ).get() as { count: number }).count;

  const topPages = db.prepare(
    "SELECT path as name, COUNT(*) as count FROM page_views WHERE created_at >= ? AND created_at <= ? GROUP BY path ORDER BY count DESC LIMIT 10"
  ).all(since, until) as TopItem[];

  const topReferrers = db.prepare(
    "SELECT referrer as name, COUNT(*) as count FROM page_views WHERE created_at >= ? AND created_at <= ? AND referrer != '' GROUP BY referrer ORDER BY count DESC LIMIT 10"
  ).all(since, until) as TopItem[];

  const topBrowsers = db.prepare(
    "SELECT browser as name, COUNT(*) as count FROM page_views WHERE created_at >= ? AND created_at <= ? AND browser != '' GROUP BY browser ORDER BY count DESC LIMIT 10"
  ).all(since, until) as TopItem[];

  const topDevices = db.prepare(
    "SELECT device as name, COUNT(*) as count FROM page_views WHERE created_at >= ? AND created_at <= ? AND device != '' GROUP BY device ORDER BY count DESC LIMIT 10"
  ).all(since, until) as TopItem[];

  const topCountries = db.prepare(
    "SELECT country as name, COUNT(*) as count FROM page_views WHERE created_at >= ? AND created_at <= ? AND country != '' GROUP BY country ORDER BY count DESC LIMIT 10"
  ).all(since, until) as TopItem[];

  return {
    totalViews,
    uniqueVisitors,
    viewsToday,
    views7d,
    views30d,
    topPages,
    topReferrers,
    topBrowsers,
    topDevices,
    topCountries,
  };
}

export interface DailyViews {
  date: string;
  views: number;
}

export function getViewsOverTime(opts: AnalyticsOptions = {}): DailyViews[] {
  const db = getDb();
  const [since, until] = resolveDateRange(opts);
  return db.prepare(
    `SELECT date(created_at) as date, COUNT(*) as views
     FROM page_views
     WHERE created_at >= ? AND created_at <= ?
     GROUP BY date(created_at)
     ORDER BY date ASC`
  ).all(since, until) as DailyViews[];
}
