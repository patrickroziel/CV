import "server-only";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const chains = new Map<string, Promise<unknown>>();

function r2Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() ?? "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() ?? "";
  const bucket = process.env.R2_BUCKET_NAME?.trim() ?? "";
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

export function blobReady() {
  return r2Config() !== null;
}

function r2Client(config: NonNullable<ReturnType<typeof r2Config>>) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
}

function r2Key(name: string) {
  const safe = name.replace(/[^a-z0-9_-]/gi, "");
  return `patrick-roziel/stores/${safe || "portfolio"}.json`;
}

export function enqueue<T>(key: string, job: () => Promise<T>): Promise<T> {
  const previous = chains.get(key) ?? Promise.resolve();
  const run = previous.then(job, job);
  chains.set(key, run.then(() => undefined, () => undefined));
  return run;
}

function missingObject(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const code = "$metadata" in error
    ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
    : 0;
  return name === "NoSuchKey" || name === "NotFound" || code === 404;
}

export async function readJsonBlob<T>(name: string): Promise<T | null> {
  const config = r2Config();
  if (!config) return null;
  try {
    const result = await r2Client(config).send(new GetObjectCommand({
      Bucket: config.bucket,
      Key: r2Key(name),
    }));
    const text = await result.Body?.transformToString();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (error) {
    if (missingObject(error)) return null;
    throw error;
  }
}

export async function writeJsonBlob(name: string, value: unknown) {
  const config = r2Config();
  if (!config) throw new Error("Cloudflare R2 n’est pas configuré.");
  await r2Client(config).send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: r2Key(name),
    Body: JSON.stringify(value),
    ContentType: "application/json",
    CacheControl: "no-store",
  }));
}
