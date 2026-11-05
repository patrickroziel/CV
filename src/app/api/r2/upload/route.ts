import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isBackofficeAdmin, validateOrigin } from "@/lib/server/backoffice-auth";

export const runtime = "nodejs";

function getR2Client() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Variables R2 manquantes (CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim()?.replace(/\/$/, "");

  if (!bucket || !publicUrl) {
    return NextResponse.json(
      { error: "R2_BUCKET_NAME ou R2_PUBLIC_URL manquant." },
      { status: 503 }
    );
  }

  const allow =
    process.env.NODE_ENV === "development" ||
    ((await isBackofficeAdmin()) && validateOrigin(request));
  if (!allow) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  let body: { pathname?: string; contentType?: string; size?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const pathname = (body.pathname || "").replace(/^\/+/, "");
  if (
    !pathname ||
    pathname.includes("..") ||
    (!pathname.startsWith("patrick-roziel/") && pathname !== "patrick-roziel")
  ) {
    return NextResponse.json({ error: "Chemin de stockage non autorisé." }, { status: 400 });
  }

  const contentType = body.contentType || "application/octet-stream";
  const size = typeof body.size === "number" ? body.size : 0;
  const MAX = 100 * 1024 * 1024;
  if (size > MAX) {
    return NextResponse.json({ error: "Fichier trop lourd (max 100 Mo)." }, { status: 400 });
  }

  try {
    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: pathname,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(client, command, { expiresIn: 60 * 10 });

    const publicFileUrl = `${publicUrl}/${pathname}`;

    return NextResponse.json({
      uploadUrl: signedUrl,
      publicUrl: publicFileUrl,
      pathname,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
