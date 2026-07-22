import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type SignBody = {
  folder?: string;
};

/**
 * Returns a short-lived signed upload payload.
 * API secret never leaves the server.
 *
 * Requires CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET in env.
 * Without them, clients fall back to the unsigned upload preset.
 */
export async function POST(request: Request) {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary signed upload non configuré" },
      { status: 503 }
    );
  }

  // Optional hard lock: only allow when explicitly enabled (or in development)
  const allow =
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_CLOUDINARY_UPLOAD === "true" ||
    process.env.NEXT_PUBLIC_ALLOW_EDIT === "true";

  if (!allow) {
    return NextResponse.json({ error: "Upload désactivé" }, { status: 403 });
  }

  let body: SignBody = {};
  try {
    body = (await request.json()) as SignBody;
  } catch {
    body = {};
  }

  const folder =
    typeof body.folder === "string" && body.folder.trim()
      ? body.folder.trim().replace(/^\/+|\/+$/g, "")
      : "patrick-roziel";

  // Prevent path traversal / arbitrary folders outside our namespace
  if (
    folder.includes("..") ||
    (!folder.startsWith("patrick-roziel") && folder !== "patrick-roziel")
  ) {
    return NextResponse.json({ error: "Dossier non autorisé" }, { status: 400 });
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = {
    timestamp,
    folder,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    apiSecret
  );

  return NextResponse.json({
    signature,
    timestamp,
    cloudName,
    apiKey,
    folder,
  });
}
