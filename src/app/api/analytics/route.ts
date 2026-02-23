import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAnalyticsSummary, getViewsOverTime } from "@/lib/analytics";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const authErr = requireAuth(request);
  if (authErr) return authErr;

  const params = request.nextUrl.searchParams;
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;
  const days = parseInt(params.get("days") || "30");

  if ((from && !DATE_RE.test(from)) || (to && !DATE_RE.test(to))) {
    return NextResponse.json({ error: "Invalid date format, use YYYY-MM-DD" }, { status: 400 });
  }

  const opts = from && to ? { from, to } : { days };
  const summary = getAnalyticsSummary(opts);
  const viewsOverTime = getViewsOverTime(opts);

  return NextResponse.json({ ...summary, viewsOverTime });
}
