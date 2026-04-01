import { createClient } from "@/lib/supabase/server";
import { getR2Client, R2_BUCKET_NAME } from "@/lib/r2-server";
import { requireValidTurnstile } from "@/lib/verify-turnstile";
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

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      const tsToken =
        (formData.get("cf-turnstile-response") as string | null) ||
        (formData.get("turnstileToken") as string | null);
      const tsBlock = await requireValidTurnstile(request, tsToken);
      if (tsBlock) return tsBlock;
    }

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
    const r2Client = getR2Client();

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      })
    );

    if (user?.id) {
      await supabase.from("gallery_items").insert({
        user_id: user.id,
        r2_key: key,
      });
    }

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
