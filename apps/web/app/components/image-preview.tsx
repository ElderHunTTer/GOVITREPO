"use client";

import Image from "next/image";
import { useState } from "react";

export function ImagePreview({
  src,
  alt
}: {
  src: string;
  alt: string;
}) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const zoomIn = () => setScale((value) => Math.min(3, Number((value + 0.25).toFixed(2))));
  const zoomOut = () => setScale((value) => Math.max(0.8, Number((value - 0.25).toFixed(2))));
  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const nudge = (x: number, y: number) => {
    setOffset((value) => ({
      x: value.x + x,
      y: value.y + y
    }));
  };

  return (
    <div className="image-preview-shell">
      <div className="image-preview-toolbar">
        <span className="field-label">Preview controls</span>
        <div className="image-preview-actions">
          <button className="secondary-button compact-button" onClick={() => nudge(0, -32)} type="button">
            Up
          </button>
          <button className="secondary-button compact-button" onClick={() => nudge(-32, 0)} type="button">
            Left
          </button>
          <button className="secondary-button compact-button" onClick={() => nudge(32, 0)} type="button">
            Right
          </button>
          <button className="secondary-button compact-button" onClick={() => nudge(0, 32)} type="button">
            Down
          </button>
          <button className="secondary-button compact-button" onClick={zoomOut} type="button">
            Zoom out
          </button>
          <button className="secondary-button compact-button" onClick={zoomIn} type="button">
            Zoom in
          </button>
          <button className="secondary-button compact-button" onClick={resetView} type="button">
            Reset
          </button>
        </div>
      </div>

      <div className="image-preview-frame">
        <div
          className="image-preview-asset"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
          }}
        >
          <Image alt={alt} fill sizes="(max-width: 920px) 100vw, 960px" src={src} unoptimized />
        </div>
      </div>
    </div>
  );
}
