import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, RotateCcw } from "lucide-react";
import {
  archiveAdaptationAction,
  publishAdaptationAction,
  publishAllAction,
  regenerateAdaptationAction,
  saveAdaptationAction
} from "@/app/admin/actions";
import { AdminShell } from "@/components/AdminChrome";
import { PublishSubmitToast } from "@/components/PublishSubmitToast";
import { formatQuestions, formatVocabulary } from "@/lib/parsers";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchParams = {
  level?: string;
  validation?: string;
};

export default async function ReviewPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  const content = await prisma.contentItem.findUniqueOrThrow({
    where: { id },
    include: {
      adaptations: {
        include: { readingLevel: true, targetLocale: true },
        orderBy: { readingLevel: { sortOrder: "asc" } }
      }
    }
  });

  const selected =
    content.adaptations.find((adaptation) => adaptation.readingLevelId === query.level) ??
    content.adaptations[0];
  const hasValidationError = query.validation === "review";

  return (
    <AdminShell>
      <PublishSubmitToast />
      <div className="admin-header" style={{ borderBottom: 0, paddingBottom: 0 }}>
        <div>
          <span className="chip">Review Mode</span>
          <h1 className="admin-title" style={{ marginTop: 18 }}>
            Review: {content.sourceTitle}
          </h1>
        </div>
        {content.adaptations.length > 0 ? (
          <form action={publishAllAction.bind(null, content.id)} data-publish-form="true">
            <button className="btn btn-primary" type="submit">
              <CheckCircle2 size={16} /> Publish All
            </button>
          </form>
        ) : null}
      </div>

      {content.adaptations.length === 0 ? (
        <section className="panel-card">
          <h2>No generated versions yet</h2>
          <p className="muted">Go back to the source editor and generate versions for this item.</p>
          <Link className="btn btn-primary" href={`/admin/content/${content.id}/edit`}>
            Open Editor
          </Link>
        </section>
      ) : (
        <>
          <nav className="tabs" aria-label="Adaptation levels">
            {content.adaptations.map((adaptation) => (
              <Link
                key={adaptation.id}
                href={`/admin/content/${content.id}/review?level=${adaptation.readingLevelId}`}
                aria-current={adaptation.id === selected.id ? "page" : undefined}
              >
                {adaptation.readingLevel.displayName}
              </Link>
            ))}
          </nav>

          <div className="review-layout">
            <form className="form-card" action={saveAdaptationAction.bind(null, selected.id)}>
              {hasValidationError ? (
                <p className="form-error form-error-banner" id="review-form-error" role="alert" aria-live="polite">
                  Add an article title and at least 20 characters of article body before saving.
                </p>
              ) : null}
              <div className="field">
                <label htmlFor="title">Article Title</label>
                <input
                  className="input"
                  id="title"
                  name="title"
                  defaultValue={selected.title}
                  aria-describedby={hasValidationError ? "title-error review-form-error" : undefined}
                  aria-invalid={hasValidationError ? true : undefined}
                  required
                />
                {hasValidationError ? (
                  <p className="form-error" id="title-error">
                    Article title is required.
                  </p>
                ) : null}
              </div>
              <div className="field" style={{ marginTop: 18 }}>
                <label htmlFor="summary">Summary / Meta Description</label>
                <textarea className="textarea" id="summary" name="summary" defaultValue={selected.summary ?? ""} />
              </div>
              <div className="field" style={{ marginTop: 18 }}>
                <label htmlFor="bodyMarkdown">Article Body</label>
                <textarea
                  className="textarea source-textarea"
                  id="bodyMarkdown"
                  name="bodyMarkdown"
                  defaultValue={selected.bodyMarkdown}
                  aria-describedby={hasValidationError ? "bodyMarkdown-error review-form-error" : undefined}
                  aria-invalid={hasValidationError ? true : undefined}
                  required
                />
                {hasValidationError ? (
                  <p className="form-error" id="bodyMarkdown-error">
                    Article body must be at least 20 characters.
                  </p>
                ) : null}
              </div>
              <div
                className="field"
                style={{ marginTop: 34, borderTop: "1px solid var(--surface-highest)", paddingTop: 30 }}
              >
                <h2 className="section-title" style={{ fontSize: 28 }}>
                  English Check Translation
                </h2>
                <label htmlFor="checkTranslationTitle">English Title</label>
                <input
                  className="input"
                  id="checkTranslationTitle"
                  name="checkTranslationTitle"
                  defaultValue={selected.checkTranslationTitle ?? ""}
                />
              </div>
              <div className="field" style={{ marginTop: 18 }}>
                <label htmlFor="checkTranslationSummary">English Summary</label>
                <textarea
                  className="textarea"
                  id="checkTranslationSummary"
                  name="checkTranslationSummary"
                  defaultValue={selected.checkTranslationSummary ?? ""}
                />
              </div>
              <div className="field" style={{ marginTop: 18 }}>
                <label htmlFor="checkTranslationBodyMarkdown">English Body</label>
                <textarea
                  className="textarea source-textarea"
                  id="checkTranslationBodyMarkdown"
                  name="checkTranslationBodyMarkdown"
                  defaultValue={selected.checkTranslationBodyMarkdown ?? ""}
                />
              </div>
              <div className="field" style={{ marginTop: 34, borderTop: "1px solid var(--surface-highest)", paddingTop: 30 }}>
                <h2 className="section-title" style={{ fontSize: 28 }}>
                  Vocabulary List
                </h2>
                <p className="muted">One row per word: term | English meaning | part of speech</p>
                <textarea
                  className="textarea"
                  id="vocabularyText"
                  name="vocabularyText"
                  defaultValue={formatVocabulary(selected.vocabulary)}
                />
              </div>
              <div className="field" style={{ marginTop: 34, borderTop: "1px solid var(--surface-highest)", paddingTop: 30 }}>
                <h2 className="section-title" style={{ fontSize: 28 }}>
                  Comprehension Questions
                </h2>
                <p className="muted">One row per question: question | answer</p>
                <textarea
                  className="textarea"
                  id="questionsText"
                  name="questionsText"
                  defaultValue={formatQuestions(selected.comprehensionQuestions)}
                />
              </div>
              <div className="field" style={{ marginTop: 18 }}>
                <label htmlFor="editorNotes">Editor Notes</label>
                <textarea className="textarea" id="editorNotes" name="editorNotes" defaultValue={selected.editorNotes ?? ""} />
              </div>
              <input type="hidden" name="subtitle" value={selected.subtitle ?? ""} />
              <div className="action-bar">
                <button className="btn btn-secondary" type="submit">
                  Save Edits
                </button>
              </div>
            </form>

            <aside className="sidebar-stack">
              <section className="panel-card">
                <h2>QA Notes</h2>
                <div className="definition-list">
                  <div className="definition-item">
                    <strong>
                      {selected.qaStatus === "passed" ? (
                        <CheckCircle2 size={16} color="var(--sage)" />
                      ) : (
                        <AlertTriangle size={16} color="var(--terracotta)" />
                      )}{" "}
                      {selected.qaStatus.replaceAll("_", " ")}
                    </strong>
                    <p className="muted">Fact preservation checked against the stored fact bank.</p>
                  </div>
                  <div className="definition-item">
                    <strong>
                      <Info size={16} /> Level
                    </strong>
                    <p className="muted">
                      {selected.targetLocale.displayNameEn} · {selected.readingLevel.displayName}
                    </p>
                  </div>
                </div>
              </section>
              <section className="panel-card">
                <div className="definition-list">
                  <form action={regenerateAdaptationAction.bind(null, selected.id)}>
                    <button className="btn btn-danger" type="submit">
                      <RotateCcw size={16} /> Regenerate This Level
                    </button>
                  </form>
                  <form action={publishAdaptationAction.bind(null, selected.id)} data-publish-form="true">
                    <button className="btn btn-primary" type="submit">
                      Publish This Level
                    </button>
                  </form>
                  <form action={archiveAdaptationAction.bind(null, selected.id)}>
                    <button className="btn btn-secondary" type="submit">
                      Archive This Level
                    </button>
                  </form>
                </div>
              </section>
            </aside>
          </div>
        </>
      )}
    </AdminShell>
  );
}
