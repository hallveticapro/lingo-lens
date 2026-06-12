import { notFound } from "next/navigation";
import { mediaFallbackUrl, readMedia } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (path[0] !== "media") notFound();
  const storageKey = path.join("/");

  try {
    const { bytes, metadata } = await readMedia(storageKey);
    return new Response(bytes, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(metadata.size),
        "Content-Type": "image/webp"
      }
    });
  } catch {
    const fallbackUrl = await mediaFallbackUrl(storageKey);
    if (fallbackUrl) return Response.redirect(fallbackUrl, 307);
    notFound();
  }
}
