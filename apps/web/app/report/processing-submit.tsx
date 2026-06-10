"use client";

import { useFormStatus } from "react-dom";

export function ProcessingSubmit() {
  const { pending } = useFormStatus();

  return (
    <>
      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Processing label..." : "Check label"}
      </button>

      {pending ? (
        <div className="processing-overlay" role="status" aria-live="polite">
          <div className="processing-panel">
            <div className="processing-spinner" aria-hidden="true" />
            <p className="eyebrow">Processing label</p>
            <h2>Validating the upload before we open the case.</h2>
            <p className="panel-copy">
              We are running OCR, checking whether this looks like an alcohol
              label, extracting visible fields, and preparing your case
              reference.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
