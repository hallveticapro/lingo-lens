"use client";

import { useEffect, useState } from "react";

export function GenerationSubmitToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onSubmit(event: SubmitEvent) {
      const form = event.target;
      const submitter = event.submitter;
      if (!(form instanceof HTMLFormElement) || !(submitter instanceof HTMLButtonElement)) return;
      if (form.dataset.generationForm !== "true") return;
      if (submitter.name !== "intent" || submitter.value !== "generate") return;
      setVisible(true);
    }

    document.addEventListener("submit", onSubmit);
    return () => document.removeEventListener("submit", onSubmit);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timeout = window.setTimeout(() => setVisible(false), 15000);
    return () => window.clearTimeout(timeout);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="toast-notice toast-generate" role="status" aria-live="polite">
      Article generation queued. Returning to dashboard...
    </div>
  );
}
