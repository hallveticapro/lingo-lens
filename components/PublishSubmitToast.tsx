"use client";

import { useEffect, useState } from "react";

export function PublishSubmitToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.dataset.publishForm !== "true") return;
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
    <div className="toast-notice" role="status" aria-live="polite">
      Publishing articles. Returning to dashboard...
    </div>
  );
}
