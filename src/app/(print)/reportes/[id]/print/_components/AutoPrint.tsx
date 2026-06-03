'use client';
import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

/**
 * Single-page PDF export.
 *
 * The print layout declares `@page { size: 1920px auto }`, but `auto` resolves
 * to the default paper height (Letter/A4), so a tall report gets sliced into
 * multiple sheets. To force the WHOLE report onto one continuous page we
 * measure the rendered content height and override `@page` with an explicit
 * height right before printing.
 */
export function AutoPrint() {
  const [ready, setReady] = useState(false);

  function applySinglePageSize() {
    // Full rendered height of the report (body is fixed at 1920px wide).
    const height = Math.ceil(
      Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      ),
    );
    let style = document.getElementById('single-page-size') as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'single-page-size';
      document.head.appendChild(style);
    }
    // Last @page declaration wins — overrides the layout's `auto` height.
    style.textContent = `@page { size: 1920px ${height}px; margin: 0; }`;
  }

  function download() {
    applySinglePageSize();
    window.print();
  }

  useEffect(() => {
    function waitForImages() {
      const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('img'));
      const pending = imgs.filter(img => !img.complete);
      const go = () => { setReady(true); download(); };
      if (pending.length === 0) { go(); return; }
      let resolved = 0;
      const onSettle = () => {
        resolved++;
        if (resolved >= pending.length) go();
      };
      pending.forEach(img => {
        img.addEventListener('load', onSettle, { once: true });
        img.addEventListener('error', onSettle, { once: true });
      });
      // Safety timeout: print after 8s even if some images never load
      setTimeout(() => { if (!ready) go(); }, 8000);
    }

    // Small ramp-up delay so React finishes painting
    const t = setTimeout(waitForImages, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="print:hidden fixed bottom-6 right-6 z-50">
      <button
        onClick={download}
        className="flex items-center gap-2 px-5 py-3 bg-[#111827] hover:bg-[#1f2937] text-white text-sm font-semibold rounded-xl shadow-lg transition-colors"
      >
        <Download className="w-4 h-4" />
        {ready ? 'Descargar PDF' : 'Cargando…'}
      </button>
    </div>
  );
}
