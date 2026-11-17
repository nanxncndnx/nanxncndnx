"use client";
import { useEffect, useRef, useState } from "react";

/* Draws every page of a PDF straight onto the page (no viewer, no toolbar).
   The PDF file itself is only read, never changed. */

const PAGE_GAP = "28px"; // space between pages

export default function PdfPages({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        const pdf = await pdfjs.getDocument(url).promise;
        if (cancelled) return;
        container.replaceChildren();

        const width = container.clientWidth;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * dpr });

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          canvas.style.marginBottom = PAGE_GAP;
          canvas.setAttribute("aria-label", `Page ${n} of ${pdf.numPages}`);
          container.appendChild(canvas);

          await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
          if (n === 1 && !cancelled) setStatus("ready");
        }
      } catch (err) {
        console.error("Could not render PDF", err);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  return (
    <div>
      {status === "loading" && <p className="text-gray-600">Loading…</p>}
      {status === "error" && (
        <p className="text-gray-700">
          The document couldn&apos;t be shown here.{" "}
          <a href={url} className="text-blue-600 hover:underline">Open the PDF instead.</a>
        </p>
      )}
      <div ref={containerRef} />
    </div>
  );
}
