"use client";

import { useFormStatus } from "react-dom";

export function ReviewIntakeSubmit() {
  const { pending } = useFormStatus();

  return (
    <>
      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Processing intake..." : "Run intake"}
      </button>

      {pending ? (
        <div aria-live="polite" className="processing-overlay" role="status">
          <div className="processing-panel">
            <div aria-hidden="true" className="processing-spinner" />
            <p className="eyebrow">Processing intake</p>
            <h2>Analyzing the uploaded label before opening the review.</h2>
            <p className="panel-copy">
              We are storing the image, checking whether this looks like a TTB
              alcohol label, extracting visible fields, and preparing the
              reviewer queue entry.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
