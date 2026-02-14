import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAnalyticsSummary, getViewsOverTime } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  const authErr = requireAuth(request);
  if (authErr) return authErr;

  const days = parseInt(request.nextUrl.searchParams.get("days") || "30");
  const summary = getAnalyticsSummary(days);
  const viewsOverTime = getViewsOverTime(days);

  return NextResponse.json({ ...summary, viewsOverTime });
}
