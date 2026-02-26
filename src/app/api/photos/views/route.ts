import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { resetAllPhotoViews } from "@/lib/db";

export async function DELETE(request: NextRequest) {
  const authErr = requireAuth(request);
  if (authErr) return authErr;

  resetAllPhotoViews();
  return NextResponse.json({ success: true });
}
