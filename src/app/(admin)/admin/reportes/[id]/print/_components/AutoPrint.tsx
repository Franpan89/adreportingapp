'use client';
import { useEffect } from 'react';

/** Triggers window.print() after a short delay to allow images to load. */
export function AutoPrint() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 900);
    return () => clearTimeout(t);
  }, []);
  return null;
}
