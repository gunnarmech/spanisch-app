import { afterEach, describe, expect, it, vi } from 'vitest';
import { recognize, recordClip, speechSupported } from '../../src/media/speech';

type Behaviour = (self: FakeRecognition) => void;
let behaviours: Behaviour[] = [];
const langs: string[] = [];

class FakeRecognition {
  lang = '';
  onresult: ((e: unknown) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start() {
    langs.push(this.lang);
    const b = behaviours.shift();
    queueMicrotask(() => b?.(this));
  }
  stop() {
    queueMicrotask(() => this.onend?.());
  }
}

const w = window as unknown as Record<string, unknown>;

afterEach(() => {
  delete w.SpeechRecognition;
  delete w.webkitSpeechRecognition;
  vi.unstubAllGlobals();
  behaviours = [];
  langs.length = 0;
  vi.useRealTimers();
});

describe('speechSupported', () => {
  it('erkennt SpeechRecognition und webkitSpeechRecognition', () => {
    expect(speechSupported()).toBe(false);
    w.webkitSpeechRecognition = FakeRecognition;
    expect(speechSupported()).toBe(true);
  });
});

describe('recognize', () => {
  it('liefert null bei onerror', async () => {
    w.SpeechRecognition = FakeRecognition;
    behaviours = [(s) => s.onerror?.({ error: 'no-speech' })];
    expect(await recognize()).toBeNull();
    expect(langs).toEqual(['es-CL']);
  });

  it('liefert null ohne Erkennung im Browser', async () => {
    expect(await recognize()).toBeNull();
  });

  it('liefert den erkannten Text', async () => {
    w.SpeechRecognition = FakeRecognition;
    behaviours = [(s) => s.onresult?.({ results: [[{ transcript: 'donde esta el baño' }]] })];
    expect(await recognize()).toBe('donde esta el baño');
  });

  it('versucht es bei Sprachfehler einmal mit es-419', async () => {
    w.SpeechRecognition = FakeRecognition;
    behaviours = [
      (s) => s.onerror?.({ error: 'language-not-supported' }),
      (s) => s.onresult?.({ results: [[{ transcript: 'hola' }]] }),
    ];
    expect(await recognize()).toBe('hola');
    expect(langs).toEqual(['es-CL', 'es-419']);
  });

  it('liefert null nach der Zeitüberschreitung', async () => {
    vi.useFakeTimers();
    w.SpeechRecognition = FakeRecognition;
    behaviours = [() => {}];
    const p = recognize('es-CL', 8000);
    await vi.advanceTimersByTimeAsync(8000);
    expect(await p).toBeNull();
  });
});

describe('recordClip', () => {
  it('liefert null, wenn MediaRecorder fehlt', async () => {
    expect(await recordClip()).toBeNull();
  });

  it('liefert null, wenn das Mikrofon abgelehnt wird', async () => {
    vi.stubGlobal('MediaRecorder', class {});
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: () => Promise.reject(new Error('denied')) } });
    expect(await recordClip()).toBeNull();
  });
});
