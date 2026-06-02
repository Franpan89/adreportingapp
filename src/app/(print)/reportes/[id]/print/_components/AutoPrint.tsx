'use client';
import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';

/**
 * Waits for all images on the page to finish loading, then triggers window.print().
 * Also renders a persistent "Print / Re-print" button for after the dialog closes.
 */
export function AutoPrint() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function waitForImages() {
      const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('img'));
      const pending = imgs.filter(img => !img.complete);
      if (pending.length === 0) {
        setReady(true);
        window.print();
        return;
      }
      let resolved = 0;
      const onSettle = () => {
        resolved++;
        if (resolved >= pending.length) {
          setReady(true);
          window.print();
        }
      };
      pending.forEach(img => {
        img.addEventListener('load', onSettle, { once: true });
        img.addEventListener('error', onSettle, { once: true });
      });
      // Safety timeout: print after 8s even if some images never load
      setTimeout(() => {
        if (!ready) {
          setReady(true);
          window.print();
        }
      }, 8000);
    }

    // Small ramp-up delay so React finishes painting
    const t = setTimeout(waitForImages, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="print:hidden fixed bottom-6 right-6 z-50">
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-5 py-3 bg-[#111827] hover:bg-[#1f2937] text-white text-sm font-semibold rounded-xl shadow-lg transition-colors"
      >
        <Printer className="w-4 h-4" />
        {ready ? 'Imprimir / Guardar PDF' : 'Cargando…'}
      </button>
    </div>
  );
}
