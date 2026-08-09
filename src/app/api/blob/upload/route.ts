import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Client upload handshake for @vercel/blob.
 * Requires BLOB_READ_WRITE_TOKEN in the environment (Vercel Storage → Blob).
 *
 * Flow: browser calls this route → receives a short-lived token → uploads
 * the file directly to Blob → public URL returned to the client.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return NextResponse.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN manquant. Créez un token dans Vercel → Storage → Blob.",
      },
      { status: 503 }
    );
  }

  const allow =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ALLOW_EDIT === "true" ||
    process.env.ALLOW_BLOB_UPLOAD === "true";

  if (!allow) {
    return NextResponse.json(
      { error: "Upload désactivé (définissez NEXT_PUBLIC_ALLOW_EDIT ou ALLOW_BLOB_UPLOAD)." },
      { status: 403 }
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const path = pathname.replace(/^\/+/, "");
        if (
          path.includes("..") ||
          (!path.startsWith("patrick-roziel/") && path !== "patrick-roziel")
        ) {
          throw new Error("Chemin de stockage non autorisé.");
        }

        return {
          allowedContentTypes: [
            // Images (+ alpha stills)
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/svg+xml",
            "image/avif",
            // Short / alpha videos
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "video/x-m4v",
            // Documents
            "application/pdf",
            "text/html",
            "application/octet-stream",
          ],
          addRandomSuffix: true,
          // Align with client guard (large showreels → YouTube)
          maximumSizeInBytes: 100 * 1024 * 1024,
          tokenPayload: JSON.stringify({
            purpose: "portfolio-edit",
          }),
        };
      },
      onUploadCompleted: async () => {
        // Optional: webhook/logging — no-op for localStorage portfolio
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
