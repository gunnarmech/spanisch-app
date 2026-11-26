import { useRef, useState } from 'preact/hooks';
import { useKey } from './tasks/keys';

type Props = { canKnow: boolean; onKnown(): void; onReport(text: string): Promise<void> };

/** Kleine Knöpfe unter jeder Aufgabe: "Kann ich schon" und "Fehler melden". */
export function TaskTools({ canKnow, onKnown, onReport }: Props) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const text = useRef<HTMLTextAreaElement>(null);
  useKey((e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  const send = async (e: Event) => {
    e.preventDefault();
    const value = text.current?.value.trim();
    if (!value) return;
    await onReport(value);
    setOpen(false);
    setSent(true);
  };

  return (
    <div class="tools">
      <div class="tool-row">
        {canKnow && (
          <button type="button" class="link" onClick={onKnown}>
            Kann ich schon
          </button>
        )}
        {sent ? (
          <span class="muted">Fehler gemeldet.</span>
        ) : (
          <button type="button" class="link" onClick={() => setOpen(!open)} aria-expanded={open}>
            Fehler melden
          </button>
        )}
      </div>
      {open && (
        <form class="report" onSubmit={send}>
          <label class="label">
            Was stimmt nicht?
            <textarea class="field" ref={text} rows={3} autoFocus />
          </label>
          <div class="tool-row">
            <button type="submit" class="btn btn--secondary">
              Melden
            </button>
            <button type="button" class="link" onClick={() => setOpen(false)}>
              Abbrechen
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
