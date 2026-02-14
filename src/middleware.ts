import { NextRequest, NextResponse } from "next/server";

const BOT_PATTERN = /bot|crawl|spider|slurp|googlebot|bingbot|yandex|baidu|duckduck/i;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes, static files, and Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2|ttf)$/)
  ) {
    return NextResponse.next();
  }

  const userAgent = request.headers.get("user-agent") || "";

  // Skip bots
  if (BOT_PATTERN.test(userAgent)) {
    return NextResponse.next();
  }

  // Fire tracking request asynchronously (don't block the response)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const referrer = request.headers.get("referer") || "";

  const trackingUrl = new URL("/api/analytics/track", request.url);

  try {
    fetch(trackingUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer,
        userAgent,
        ip,
      }),
    }).catch(() => {
      // Silently ignore tracking failures
    });
  } catch {
    // Silently ignore
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|photos|thumbnails).*)",
  ],
};
