import { useEffect, useRef } from 'preact/hooks';

export function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
}

/** Hängt einen Tastendruck-Handler ans Fenster, solange die Komponente steht. */
export function useKey(handler: (e: KeyboardEvent) => void): void {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const f = (e: KeyboardEvent) => ref.current(e);
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);
}
