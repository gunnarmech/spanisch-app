type Recognition = {
  lang: string;
  interimResults?: boolean;
  maxAlternatives?: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};
type RecognitionCtor = new () => Recognition;

function ctor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported(): boolean {
  return ctor() !== null;
}

/** Ob Aufnahme per Mikrofon grundsätzlich möglich ist (die Erlaubnis zeigt sich erst beim Aufnehmen). */
export function recordingSupported(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  );
}

type Attempt = { text: string | null; languageError: boolean };

function attempt(Ctor: RecognitionCtor, lang: string, timeoutMs: number): Promise<Attempt> {
  return new Promise((resolve) => {
    let settled = false;
    let rec: Recognition;
    const finish = (a: Attempt) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(a);
    };
    const timer = setTimeout(() => {
      try {
        rec.stop();
      } catch {
        // schon beendet
      }
      finish({ text: null, languageError: false });
    }, timeoutMs);
    try {
      rec = new Ctor();
      rec.lang = lang;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const text = e.results[0]?.[0]?.transcript?.trim();
        finish({ text: text || null, languageError: false });
      };
      rec.onerror = (e) => finish({ text: null, languageError: e.error === 'language-not-supported' });
      rec.onend = () => finish({ text: null, languageError: false });
      rec.start();
    } catch {
      finish({ text: null, languageError: false });
    }
  });
}

/** Erkannter Text oder null bei Fehler, Ablehnung und Zeitüberschreitung. Bei Sprachfehler einmal mit es-419. */
export async function recognize(lang = 'es-CL', timeoutMs = 8000): Promise<string | null> {
  const Ctor = ctor();
  if (!Ctor) return null;
  const first = await attempt(Ctor, lang, timeoutMs);
  if (first.text !== null || !first.languageError || lang === 'es-419') return first.text;
  return (await attempt(Ctor, 'es-419', timeoutMs)).text;
}

/** Nimmt bis zu maxMs auf. null, wenn Aufnahme nicht verfügbar oder das Mikrofon abgelehnt ist. */
export async function recordClip(maxMs = 6000): Promise<Blob | null> {
  if (!recordingSupported()) return null;
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    return null;
  }
  const release = () => stream.getTracks().forEach((t) => t.stop());
  try {
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    return await new Promise<Blob | null>((resolve) => {
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onerror = () => resolve(null);
      recorder.onstop = () => resolve(chunks.length ? new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }) : null);
      recorder.start();
      setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, maxMs);
    });
  } catch {
    return null;
  } finally {
    release();
  }
}
