import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { audioUrl, loadManifest, play, playSequence, stopAudio, prefetchSituation, prefetchSituations, prefetchTargets, type Manifest } from '../../src/media/audio';

const manifest: Manifest = {
  'w-hola': [
    { voice: 'mx-f', speed: 'normal' },
    { voice: 'cl-f', speed: 'normal' },
    { voice: 'cl-f', speed: 'slow' },
  ],
  'w-solo': [{ voice: 'co-m', speed: 'normal' }],
};
const base = import.meta.env.BASE_URL;

afterEach(() => vi.restoreAllMocks());

describe('audioUrl', () => {
  it('nimmt bei preferChile die chilenische Stimme', () => {
    expect(audioUrl('01', 'w-hola', { speed: 'normal', preferChile: true }, manifest)).toBe(
      `${base}audio/01/w-hola-cl-f-normal.mp3`,
    );
  });

  it('nimmt die ausdrücklich gewünschte Stimme', () => {
    expect(audioUrl('01', 'w-hola', { speed: 'normal', voice: 'mx-f' }, manifest)).toBe(
      `${base}audio/01/w-hola-mx-f-normal.mp3`,
    );
  });

  it('fällt auf eine vorhandene Stimme zurück', () => {
    expect(audioUrl('01', 'w-solo', { speed: 'normal', preferChile: true }, manifest)).toBe(
      `${base}audio/01/w-solo-co-m-normal.mp3`,
    );
    expect(audioUrl('01', 'w-hola', { speed: 'normal', voice: 'co-f' }, manifest)).toBe(
      `${base}audio/01/w-hola-mx-f-normal.mp3`,
    );
  });

  it('liefert null ohne Eintrag', () => {
    expect(audioUrl('01', 'gibt-es-nicht', { speed: 'normal' }, manifest)).toBeNull();
    expect(audioUrl('01', 'w-hola', { speed: 'fast' }, manifest)).toBeNull();
  });
});

describe('audioUrl mit Hash', () => {
  const hashed: Manifest = { 'w-hola': [{ voice: 'cl-f', speed: 'normal', hash: 'abc123' }] };

  it('hängt den Manifest-Hash als Query an', () => {
    expect(audioUrl('01', 'w-hola', { speed: 'normal' }, hashed)).toBe(`${base}audio/01/w-hola-cl-f-normal.mp3?h=abc123`);
  });

  it('prefetch nutzt dieselbe URL wie audioUrl', async () => {
    const put = vi.fn().mockResolvedValue(undefined);
    const match = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('caches', { open: vi.fn().mockResolvedValue({ put, match }) });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, clone: () => ({}) }));
    await prefetchSituation('01', hashed);
    expect(put.mock.calls[0][0]).toBe(audioUrl('01', 'w-hola', { speed: 'normal' }, hashed));
  });

  it('legt nur vollständige 200-Antworten in den Cache', async () => {
    const put = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('caches', { open: vi.fn().mockResolvedValue({ put, match: vi.fn().mockResolvedValue(undefined) }) });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 206, clone: () => ({}) }));
    await prefetchSituation('01', hashed);
    expect(put).not.toHaveBeenCalled();
  });
});

describe('loadManifest', () => {
  it('lädt das Manifest der Situation', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => manifest });
    vi.stubGlobal('fetch', fetchMock);
    expect(await loadManifest('01')).toEqual(manifest);
    expect(fetchMock).toHaveBeenCalledWith(`${base}audio/01/manifest.json`);
  });

  it('liefert bei Fehlern ein leeres Manifest', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await loadManifest('01')).toEqual({});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    expect(await loadManifest('01')).toEqual({});
  });
});

describe('play', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  it('schluckt Fehler und loggt sie', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('NotAllowed'));
    await expect(play('x.mp3')).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });

  it('nutzt ein gemeinsames Element', async () => {
    const spy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    await play('a.mp3');
    await play('b.mp3');
    const els = spy.mock.contexts as HTMLAudioElement[];
    expect(els[0]).toBe(els[1]);
    expect(els[1].src).toContain('b.mp3');
  });
});

describe('playSequence', () => {
  it('spielt nacheinander auf einem gemeinsamen Element und wartet auf das Ende', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const spy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
      queueMicrotask(() => this.dispatchEvent(new Event('ended')));
      return Promise.resolve();
    });
    await playSequence(['a.mp3', 'b.mp3']);
    const els = spy.mock.contexts as HTMLAudioElement[];
    expect(els).toHaveLength(2);
    expect(els[0]).toBe(els[1]);
    expect(els[1].src).toContain('b.mp3');
  });

  it('schluckt Fehler und loggt sie', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('NotAllowed'));
    await expect(playSequence(['a.mp3'])).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});

describe('prefetchSituation', () => {
  it('legt alle Dateien in den Cache audio-v1', async () => {
    const put = vi.fn().mockResolvedValue(undefined);
    const open = vi.fn().mockResolvedValue({ put, match: vi.fn().mockResolvedValue(undefined) });
    vi.stubGlobal('caches', { open });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, clone: () => ({}) });
    vi.stubGlobal('fetch', fetchMock);
    await prefetchSituation('01', manifest);
    expect(open).toHaveBeenCalledWith('audio-v1');
    expect(put).toHaveBeenCalledTimes(4);
  });

  it('übersteht fehlgeschlagene Abrufe', async () => {
    const put = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('caches', { open: vi.fn().mockResolvedValue({ put, match: vi.fn().mockResolvedValue(undefined) }) });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(prefetchSituation('01', manifest)).resolves.toBeUndefined();
    expect(put).not.toHaveBeenCalled();
  });
});

describe('prefetchTargets', () => {
  it('nimmt die Situationen der Runde und die nächste, ohne Doppelte', () => {
    expect(prefetchTargets(['a', 'a', 'b'], ['a', 'b', 'c', 'd'])).toEqual(['a', 'b', 'c']);
    expect(prefetchTargets(['c'], ['a', 'b', 'c'])).toEqual(['c']);
    expect(prefetchTargets([], ['a'])).toEqual([]);
  });
});

describe('prefetchSituations', () => {
  it('lädt nichts ohne Netz', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await prefetchSituations(['01']);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('stopAudio', () => {
  it('beendet eine laufende Folge, ohne den nächsten Ton zu starten', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const spy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const run = playSequence(['a.mp3', 'b.mp3']);
    await Promise.resolve();
    await Promise.resolve();
    stopAudio();
    await run;
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
