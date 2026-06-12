"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyFeedButton({ url }: { url: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="copy-feed">
      <button className="btn btn-secondary" type="button" onClick={copyUrl}>
        {status === "copied" ? <Check size={16} /> : <Copy size={16} />}
        {status === "copied" ? "Copied" : "Copy URL"}
      </button>
      {status === "failed" ? <span className="form-error">Select the URL and copy it manually.</span> : null}
    </div>
  );
}
