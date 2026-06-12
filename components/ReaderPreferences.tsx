"use client";

import { useEffect, useState } from "react";

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

  function onChange(checked: boolean) {
    setEnabled(checked);
    writePreference(checked);
    applyPreference(checked);
  }

  return (
    <section className="panel-card reader-preferences" aria-label="Reader preferences">
      <h2>Reader Preferences</h2>
      <label className="reader-toggle-row">
        <span>Comfort mode</span>
        <span className="reader-toggle">
          <input type="checkbox" checked={enabled} onChange={(event) => onChange(event.currentTarget.checked)} />
          <span aria-hidden="true" />
        </span>
      </label>
    </section>
  );
}
