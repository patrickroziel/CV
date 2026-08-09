import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * @deprecated Cloudinary signed upload removed.
 * New uploads use Vercel Blob via POST /api/blob/upload.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Cloudinary n’est plus utilisé pour les nouveaux uploads. Utilisez Vercel Blob (BLOB_READ_WRITE_TOKEN + /api/blob/upload).",
      migrateTo: "/api/blob/upload",
    },
    { status: 410 }
  );
}
