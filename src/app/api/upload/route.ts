import { getR2Client, R2_BUCKET_NAME } from "@/lib/r2-server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const ext =
      EXT_MAP[file.type] ||
      file.name.split(".").pop()?.toLowerCase() ||
      "bin";
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const client = getR2Client();

    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      })
    );

    return NextResponse.json({
      key,
      bucket: R2_BUCKET_NAME,
    });
  } catch (err) {
    console.error("R2 upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
