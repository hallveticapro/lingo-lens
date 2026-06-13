"use client";

import Image from "next/image";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Markdown } from "@/components/Markdown";

type TextDirection = "ltr" | "rtl";

type ReaderVersion = {
  locale: string;
  dir: TextDirection;
  label: string;
  title: string;
  summary?: string | null;
  imageCaption?: string | null;
  bodyMarkdown: string;
};

type ReaderImage = {
  url: string;
  altText: string;
  unoptimized: boolean;
};

type ReaderTranslationViewProps = {
  target: ReaderVersion;
  english?: ReaderVersion | null;
  image?: ReaderImage | null;
  sourceLabel: string;
  updatedLabel: string;
};

export function ReaderTranslationView({
  target,
  english,
  image,
  sourceLabel,
  updatedLabel
}: ReaderTranslationViewProps) {
  const hasEnglish = Boolean(english?.bodyMarkdown.trim());
  const [mode, setMode] = useState<"target" | "english">("target");
  const active = mode === "english" && hasEnglish && english ? english : target;

  return (
    <>
      {hasEnglish ? (
        <div className="translation-switcher" role="group" aria-label="Article language">
          <button
            type="button"
            aria-pressed={mode === "target"}
            onClick={() => setMode("target")}
          >
            {target.label}
          </button>
          <button
            type="button"
            aria-pressed={mode === "english"}
            onClick={() => setMode("english")}
          >
            English
          </button>
        </div>
      ) : null}

      <div lang={active.locale} dir={active.dir} data-reading-mode={mode}>
        <h1 className="article-title">{active.title}</h1>
        {active.summary ? <p className="dek">{active.summary}</p> : null}
        <div className="meta-line">
          <span className="meta-pill">
            <BookOpen size={14} aria-hidden="true" /> Source: {sourceLabel}
          </span>
          <span className="meta-pill">Updated {updatedLabel}</span>
        </div>

        {image ? (
          <>
            <Image
              className="reader-hero-image"
              src={image.url}
              alt={image.altText}
              width={1200}
              height={770}
              sizes="(max-width: 900px) 100vw, 720px"
              unoptimized={image.unoptimized}
            />
            {active.imageCaption ? <p className="caption">{active.imageCaption}</p> : null}
          </>
        ) : null}

        <Markdown className="reader-body">{active.bodyMarkdown}</Markdown>
      </div>
    </>
  );
}
