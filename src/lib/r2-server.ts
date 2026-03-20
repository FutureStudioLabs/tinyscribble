import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT = process.env.R2_ENDPOINT;

export function getR2Client(): S3Client {
  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET_NAME ||
    !R2_ENDPOINT
  ) {
    throw new Error("Missing R2 environment variables");
  }
  return new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
}

export function assertR2Configured(): void {
  getR2Client();
}

/** Presigned GET so APIYI can fetch the drawing from a private bucket */
export async function getPresignedGetUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME!,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function putObjectBuffer(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function getObjectBuffer(key: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  const client = getR2Client();
  const out = await client.send(
    new GetObjectCommand({ Bucket: R2_BUCKET_NAME!, Key: key })
  );
  if (!out.Body) throw new Error("Empty R2 object body");
  const bytes = await out.Body.transformToByteArray();
  return {
    buffer: Buffer.from(bytes),
    contentType: out.ContentType || "application/octet-stream",
  };
}

/** Allowed key prefixes for /api/media proxy */
export function isAllowedMediaKey(key: string): boolean {
  return (
    key.startsWith("uploads/") ||
    key.startsWith("generated/") ||
    key.startsWith("videos/")
  );
}

/** When R2 returns generic octet-stream, browsers may not render <img> / <video>. */
export function inferContentTypeFromKey(key: string): string | undefined {
  const lower = key.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  return undefined;
}
