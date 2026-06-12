import { describe, expect, it } from "vitest";
import { downloadRemoteImageBytes, isBlockedRemoteAddress } from "@/lib/media";

const publicLookup = async () => [{ address: "93.184.216.34", family: 4 }];

describe("isBlockedRemoteAddress", () => {
  it("blocks localhost, private, metadata, and link-local destinations", () => {
    expect(isBlockedRemoteAddress("127.0.0.1")).toBe(true);
    expect(isBlockedRemoteAddress("10.0.0.5")).toBe(true);
    expect(isBlockedRemoteAddress("169.254.169.254")).toBe(true);
    expect(isBlockedRemoteAddress("::1")).toBe(true);
  });

  it("allows public addresses", () => {
    expect(isBlockedRemoteAddress("93.184.216.34")).toBe(false);
  });
});

describe("downloadRemoteImageBytes", () => {
  it("rejects redirects to private destinations", async () => {
    const lookupImpl = async (hostname: string) =>
      hostname === "private.test" ? [{ address: "127.0.0.1", family: 4 }] : publicLookup();
    const fetchImpl = async () =>
      new Response(null, { status: 302, headers: { location: "http://private.test/image.jpg" } });

    await expect(
      downloadRemoteImageBytes("https://example.com/image.jpg", { fetchImpl, lookupImpl })
    ).rejects.toThrow("not allowed");
  });

  it("rejects non-image MIME types", async () => {
    const fetchImpl = async () => new Response("hello", { headers: { "content-type": "text/plain" } });

    await expect(
      downloadRemoteImageBytes("https://example.com/image.jpg", { fetchImpl, lookupImpl: publicLookup })
    ).rejects.toThrow("must be an image");
  });

  it("rejects oversized declared and streamed responses", async () => {
    const declaredTooLarge = async () =>
      new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "image/png", "content-length": "9" }
      });
    const streamedTooLarge = async () =>
      new Response(new Uint8Array([1, 2, 3, 4]), {
        headers: { "content-type": "image/png" }
      });

    await expect(
      downloadRemoteImageBytes("https://example.com/image.jpg", {
        fetchImpl: declaredTooLarge,
        lookupImpl: publicLookup,
        maxBytes: 3
      })
    ).rejects.toThrow("too large");

    await expect(
      downloadRemoteImageBytes("https://example.com/image.jpg", {
        fetchImpl: streamedTooLarge,
        lookupImpl: publicLookup,
        maxBytes: 3
      })
    ).rejects.toThrow("too large");
  });

  it("times out slow responses", async () => {
    const fetchImpl = (_url: URL | RequestInfo, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });

    await expect(
      downloadRemoteImageBytes("https://example.com/image.jpg", {
        fetchImpl,
        lookupImpl: publicLookup,
        timeoutMs: 1
      })
    ).rejects.toThrow("timed out");
  });
});
