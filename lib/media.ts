import { createHash } from "node:crypto";
import { mkdir, rm, stat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";

const mediaRoot = "media";

function uploadDir() {
  return process.env.UPLOAD_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");
}

function safeStorageKey(key: string) {
  const normalized = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
  if (path.isAbsolute(normalized) || normalized.startsWith("..")) {
    throw new Error("Invalid media storage key.");
  }
  return normalized;
}

export function mediaPath(storageKey: string) {
  return path.join(uploadDir(), safeStorageKey(storageKey));
}

export async function readMedia(storageKey: string) {
  const filePath = mediaPath(storageKey);
  const [bytes, metadata] = await Promise.all([readFile(filePath), stat(filePath)]);
  return { bytes, metadata };
}

function mediaUrl(storageKey: string) {
  return `/media/${storageKey.split(path.sep).join("/")}`;
}

async function removeLocalMedia(storageKey: string | null) {
  if (!storageKey) return;
  await rm(mediaPath(storageKey), { force: true }).catch(() => undefined);
}

export async function optimizeHeaderImageForContent(contentItemId: string) {
  const content = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    include: { headerMediaAsset: true }
  });

  const media = content?.headerMediaAsset;
  if (!media?.publicUrl || media.publicUrl.startsWith("/media/")) return;

  const originalUrl = media.publicUrl;
  console.info(
    JSON.stringify({
      level: "info",
      scope: "media",
      message: "Header image optimization started",
      contentItemId,
      mediaAssetId: media.id,
      sourceUrl: originalUrl
    })
  );

  try {
    const response = await fetch(originalUrl);
    if (!response.ok) throw new Error(`Image download failed with HTTP ${response.status}`);

    const sourceBytes = Buffer.from(await response.arrayBuffer());
    const digest = createHash("sha256").update(sourceBytes).digest("hex").slice(0, 16);
    const storageKey = path.join(mediaRoot, `${media.id}-${digest}.webp`);
    const filePath = mediaPath(storageKey);
    await mkdir(path.dirname(filePath), { recursive: true });

    const optimized = await sharp(sourceBytes)
      .rotate()
      .resize({ width: 1800, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();

    await writeFile(filePath, optimized);
    await removeLocalMedia(media.storageProvider === "local" ? media.storageKey : null);

    await prisma.mediaAsset.update({
      where: { id: media.id },
      data: {
        storageProvider: "local",
        storageKey,
        publicUrl: mediaUrl(storageKey),
        mimeType: "image/webp",
        fileSizeBytes: optimized.byteLength,
        sourceUrl: media.sourceUrl ?? originalUrl
      }
    });

    console.info(
      JSON.stringify({
        level: "info",
        scope: "media",
        message: "Header image optimization succeeded",
        contentItemId,
        mediaAssetId: media.id,
        storageKey,
        fileSizeBytes: optimized.byteLength
      })
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        scope: "media",
        message: "Header image optimization failed",
        contentItemId,
        mediaAssetId: media.id,
        sourceUrl: originalUrl,
        error: error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) }
      })
    );
  }
}
