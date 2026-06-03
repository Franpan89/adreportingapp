import '@/app/globals.css';

/**
 * Standalone PDF print layout — no sidebar, no nav.
 * Format: 1920px wide, continuous long document (no A4 pagination).
 */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          @page {
            size: 1920px 99999px;
            margin: 0;
          }
          html, body {
            width: 1920px;
            background: #ffffff;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @media print {
            * { break-inside: auto !important; }
            .overflow-x-auto { overflow: visible !important; }
          }
        ` }} />
      </head>
      <body className="bg-white" style={{ width: '1920px' }}>{children}</body>
    </html>
  );
}
