import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { mkdir, rm, stat, readFile, writeFile } from "node:fs/promises";
import { BlockList, isIP } from "node:net";
import path from "node:path";
import sharp from "sharp";
import { maxRemoteImageBytes, uploadDir as configuredUploadDir } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const mediaRoot = "media";
const maxRedirects = 4;
const remoteFetchTimeoutMs = 10000;

type LookupAddress = {
  address: string;
  family: number;
};

type DownloadOptions = {
  maxBytes?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  lookupImpl?: (hostname: string) => Promise<LookupAddress[]>;
};

const blockedAddresses = new BlockList();
blockedAddresses.addAddress("0.0.0.0");
blockedAddresses.addSubnet("0.0.0.0", 8);
blockedAddresses.addSubnet("10.0.0.0", 8);
blockedAddresses.addSubnet("100.64.0.0", 10);
blockedAddresses.addSubnet("127.0.0.0", 8);
blockedAddresses.addSubnet("169.254.0.0", 16);
blockedAddresses.addSubnet("172.16.0.0", 12);
blockedAddresses.addSubnet("192.0.0.0", 24);
blockedAddresses.addSubnet("192.168.0.0", 16);
blockedAddresses.addSubnet("198.18.0.0", 15);
blockedAddresses.addSubnet("224.0.0.0", 4);
blockedAddresses.addSubnet("240.0.0.0", 4);
blockedAddresses.addAddress("255.255.255.255");
blockedAddresses.addAddress("::", "ipv6");
blockedAddresses.addAddress("::1", "ipv6");
blockedAddresses.addSubnet("fc00::", 7, "ipv6");
blockedAddresses.addSubnet("fe80::", 10, "ipv6");
blockedAddresses.addSubnet("ff00::", 8, "ipv6");

function uploadDir() {
  return configuredUploadDir() || path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");
}

function urlLogHash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function assertHttpUrl(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Remote image URL must use http or https.");
  }
}

function normalizeIpAddress(address: string) {
  if (address.startsWith("::ffff:")) return address.slice(7);
  return address;
}

export function isBlockedRemoteAddress(address: string) {
  const normalized = normalizeIpAddress(address);
  const family = isIP(normalized);
  if (family === 4) return blockedAddresses.check(normalized, "ipv4");
  if (family === 6) return blockedAddresses.check(normalized, "ipv6");
  return true;
}

async function defaultLookup(hostname: string) {
  const family = isIP(hostname);
  if (family) return [{ address: hostname, family }];
  return lookup(hostname, { all: true, verbatim: true });
}

async function assertPublicDestination(url: URL, lookupImpl: DownloadOptions["lookupImpl"]) {
  const addresses = await (lookupImpl ?? defaultLookup)(url.hostname);
  if (addresses.length === 0 || addresses.some((entry) => isBlockedRemoteAddress(entry.address))) {
    throw new Error("Remote image destination is not allowed.");
  }
}

function isRedirect(status: number) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

async function responseBytes(response: Response, maxBytes: number) {
  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new Error("Remote image is too large.");
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error("Remote image response must be an image.");
  }

  if (!response.body) return Buffer.from(await response.arrayBuffer());

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new Error("Remote image is too large.");
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

export async function downloadRemoteImageBytes(remoteUrl: string, options: DownloadOptions = {}) {
  const maxBytes = options.maxBytes ?? maxRemoteImageBytes();
  const timeoutMs = options.timeoutMs ?? remoteFetchTimeoutMs;
  const fetchImpl = options.fetchImpl ?? fetch;
  let currentUrl = new URL(remoteUrl);

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    assertHttpUrl(currentUrl);
    await assertPublicDestination(currentUrl, options.lookupImpl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetchImpl(currentUrl, {
        redirect: "manual",
        signal: controller.signal
      });
    } catch (error) {
      if (controller.signal.aborted) throw new Error("Remote image download timed out.");
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (isRedirect(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Remote image redirect is missing a location.");
      if (redirectCount === maxRedirects) throw new Error("Remote image redirected too many times.");
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    if (!response.ok) throw new Error(`Image download failed with HTTP ${response.status}`);
    return responseBytes(response, maxBytes);
  }

  throw new Error("Remote image redirected too many times.");
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
      sourceUrlHash: urlLogHash(originalUrl)
    })
  );

  try {
    const sourceBytes = await downloadRemoteImageBytes(originalUrl);
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
        sourceUrlHash: urlLogHash(originalUrl),
        error: error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) }
      })
    );
  }
}
