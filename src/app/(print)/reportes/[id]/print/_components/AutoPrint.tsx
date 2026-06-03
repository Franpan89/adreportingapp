'use client';
import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

const STYLE_ID = '__report-page-size__';

/** Measures the full content height and injects a matching @page size so
 *  Chrome saves the entire report as a single continuous sheet. */
function injectPageSize() {
  const prev = document.getElementById(STYLE_ID);
  if (prev) prev.remove();

  const heightPx = document.body.scrollHeight;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  // Keep 1920px width; use measured height so content fits on exactly one page.
  style.textContent = `@page { size: 1920px ${heightPx}px; margin: 0; }`;
  document.head.appendChild(style);
}

/**
 * Waits for all images to finish loading, then triggers window.print().
 * Renders a "Descargar PDF" button for manual re-print after the dialog closes.
 */
export function AutoPrint() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function doPrint() {
      injectPageSize();
      setReady(true);
      window.print();
    }

    function waitForImages() {
      const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('img'));
      const pending = imgs.filter(img => !img.complete);
      if (pending.length === 0) { doPrint(); return; }

      let resolved = 0;
      const onSettle = () => { if (++resolved >= pending.length) doPrint(); };
      pending.forEach(img => {
        img.addEventListener('load',  onSettle, { once: true });
        img.addEventListener('error', onSettle, { once: true });
      });
      // Safety timeout: print after 8s even if some images never load
      setTimeout(() => { if (!ready) doPrint(); }, 8000);
    }

    const t = setTimeout(waitForImages, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = () => {
    injectPageSize();
    window.print();
  };

  return (
    <div className="print:hidden fixed bottom-6 right-6 z-50">
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-5 py-3 bg-[#111827] hover:bg-[#1f2937] text-white text-sm font-semibold rounded-xl shadow-lg transition-colors"
      >
        <Download className="w-4 h-4" />
        {ready ? 'Descargar PDF' : 'Cargando…'}
      </button>
    </div>
  );
}
