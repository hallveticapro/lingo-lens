"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const storageKey = "lingolens.readerComfort";

function applyPreference(enabled: boolean) {
  document.documentElement.classList.toggle("reader-comfort", enabled);
}

function readPreference() {
  try {
    return window.localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

function writePreference(enabled: boolean) {
  try {
    window.localStorage.setItem(storageKey, String(enabled));
  } catch {
    // The visual preference still applies for the current page if storage is unavailable.
  }
}

export function ReaderPreferences() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const storedPreference = readPreference();
    setEnabled(storedPreference);
    applyPreference(storedPreference);

    return () => {
      document.documentElement.classList.remove("reader-comfort");
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onChange(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);

  function onChange(checked: boolean) {
    setEnabled(checked);
    writePreference(checked);
    applyPreference(checked);
  }

  return (
    <section className="panel-card reader-preferences" aria-label="Reader preferences">
      {enabled ? (
        <button className="reader-comfort-exit" type="button" onClick={() => onChange(false)}>
          <X size={16} aria-hidden="true" />
          Exit Comfort Mode
        </button>
      ) : (
        <>
          <h2>Reader Preferences</h2>
          <label className="reader-toggle-row">
            <span>Comfort mode</span>
            <span className="reader-toggle">
              <input type="checkbox" checked={enabled} onChange={(event) => onChange(event.currentTarget.checked)} />
              <span aria-hidden="true" />
            </span>
          </label>
        </>
      )}
    </section>
  );
}
