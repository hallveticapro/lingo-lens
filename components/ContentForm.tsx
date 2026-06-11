import type { ContentItem, Locale, MediaAsset, ReadingLevel } from "@prisma/client";

type ContentWithMedia = ContentItem & { headerMediaAsset: MediaAsset | null };

type ContentFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  locales: Locale[];
  targetLocales: Locale[];
  levels: ReadingLevel[];
  content?: ContentWithMedia;
};

export function ContentForm({ action, locales, targetLocales, levels, content }: ContentFormProps) {
  return (
    <form className="form-card" action={action}>
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="sourceTitle">Source Title</label>
          <input
            className="input"
            id="sourceTitle"
            name="sourceTitle"
            defaultValue={content?.sourceTitle}
            placeholder="e.g., The Future of Sustainable Architecture"
            required
          />
        </div>
        <div className="field full">
          <label htmlFor="sourceSubtitle">Source Subtitle</label>
          <input className="input" id="sourceSubtitle" name="sourceSubtitle" defaultValue={content?.sourceSubtitle ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="sourceLocale">Source Language</label>
          <select className="select" id="sourceLocale" name="sourceLocale" defaultValue={content?.sourceLocaleId ? undefined : "en-US"}>
            {locales.map((locale) => (
              <option value={locale.bcp47Tag} key={locale.id}>
                {locale.displayNameEn}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="contentType">Content Type</label>
          <select className="select" id="contentType" name="contentType" defaultValue={content?.contentType ?? "lesson_text"}>
            <option value="news_article">News article</option>
            <option value="public_domain_story">Public-domain story</option>
            <option value="original_story">Original story</option>
            <option value="lesson_text">Lesson text</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="field full" style={{ borderTop: "1px solid var(--surface-highest)", paddingTop: 28 }}>
          <h2 className="section-title" style={{ fontSize: 28 }}>
            Citation Details
          </h2>
        </div>
        <div className="field">
          <label htmlFor="sourceName">Source Publication / Entity</label>
          <input className="input" id="sourceName" name="sourceName" defaultValue={content?.sourceName ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="sourceUrl">Source URL</label>
          <input className="input" id="sourceUrl" name="sourceUrl" type="url" defaultValue={content?.sourceUrl ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="originalAuthor">Original Author</label>
          <input className="input" id="originalAuthor" name="originalAuthor" defaultValue={content?.originalAuthor ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="originalPublicationDate">Publication Date</label>
          <input
            className="input"
            id="originalPublicationDate"
            name="originalPublicationDate"
            type="date"
            defaultValue={content?.originalPublicationDate?.toISOString().slice(0, 10) ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="headerImageUrl">Header Image URL</label>
          <input
            className="input"
            id="headerImageUrl"
            name="headerImageUrl"
            type="url"
            defaultValue={content?.headerMediaAsset?.publicUrl ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="imageAltText">Image Alt Text</label>
          <input className="input" id="imageAltText" name="imageAltText" defaultValue={content?.headerMediaAsset?.altText ?? ""} />
        </div>
        <div className="field full">
          <label htmlFor="sourceBody">Source Text</label>
          <textarea
            className="textarea source-textarea"
            id="sourceBody"
            name="sourceBody"
            placeholder="Paste article content here..."
            defaultValue={content?.sourceBody}
            required
          />
        </div>
        <div className="field full">
          <label htmlFor="internalNotes">Internal Notes</label>
          <textarea className="textarea" id="internalNotes" name="internalNotes" defaultValue={content?.internalNotes ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="targetLocale">Target Locale</label>
          <select className="select" id="targetLocale" name="targetLocale" defaultValue="es-419">
            {targetLocales.map((locale) => (
              <option value={locale.bcp47Tag} key={locale.id}>
                {locale.displayNameEn}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <h2 className="section-title" style={{ fontSize: 28 }}>
            Levels to Generate
          </h2>
          <p className="muted">Select the difficulty tiers the AI should synthesize from the source text.</p>
          <div className="level-grid">
            {levels.map((level) => (
              <label className="check-card" key={level.id}>
                <input type="checkbox" name="levels" value={level.key} defaultChecked />
                <span>
                  <strong>{level.displayName}</strong>
                  <br />
                  <span className="muted">{level.shortDescription}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="action-bar">
        <button className="btn btn-secondary" name="intent" value="save" type="submit">
          Save Draft
        </button>
        <button className="btn btn-primary" name="intent" value="generate" type="submit">
          Generate Versions
        </button>
      </div>
    </form>
  );
}
