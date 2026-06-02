import '@/app/globals.css';

/**
 * Minimal layout for the standalone PDF print page.
 * Overrides the default @page from globals.css to use A4 landscape.
 * No sidebar, no nav — pure ReportView output.
 */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          @page {
            size: A4 landscape !important;
            margin: 10mm 14mm !important;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        ` }} />
      </head>
      <body className="bg-white">{children}</body>
    </html>
  );
}
