import { describe, expect, it } from "vitest";
import { publicReadingUrl, rssChannelImage, rssGuid, rssImageTags, xmlEscape } from "@/lib/rss";

describe("RSS helpers", () => {
  it("escapes XML-sensitive fields", () => {
    expect(xmlEscape(`A & B < "C"`)).toBe("A &amp; B &lt; &quot;C&quot;");
  });

  it("builds stable reading URLs and GUIDs", () => {
    expect(publicReadingUrl("https://example.com", "es-419", "super_beginner", "story")).toBe(
      "https://example.com/read/latam/super-beginner/story"
    );
    expect(rssGuid("content-1", "es-419", "beginner")).toBe("content:content-1:locale:es-419:level:beginner");
  });

  it("renders channel and item image metadata", () => {
    expect(rssChannelImage("https://example.com", "A & B")).toContain("<title>A &amp; B</title>");
    const tags = rssImageTags({
      url: "https://example.com/image.webp?x=1&y=2",
      mimeType: "image/webp",
      length: 42
    });

    expect(tags).toContain("<media:content");
    expect(tags).toContain("<media:thumbnail");
    expect(tags).toContain('<enclosure url="https://example.com/image.webp?x=1&amp;y=2"');
  });
});
