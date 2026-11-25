import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveBackupFile } from '../../src/store/exportFile';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const blob = () => new Blob(['{}'], { type: 'application/json' });

describe('saveBackupFile', () => {
  it('bevorzugt navigator.share mit Datei, wenn canShare erlaubt', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { canShare: () => true, share });
    const create = vi.spyOn(URL, 'createObjectURL');
    await saveBackupFile(blob(), 'sicherung.json');
    expect(share).toHaveBeenCalledTimes(1);
    expect(share.mock.calls[0][0].files[0].name).toBe('sicherung.json');
    expect(create).not.toHaveBeenCalled();
  });

  it('lädt sonst herunter und gibt die URL erst nach 30 Sekunden frei', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('navigator', {});
    URL.createObjectURL = vi.fn(() => 'blob:x');
    const revoke = (URL.revokeObjectURL = vi.fn());
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await saveBackupFile(blob(), 'sicherung.json');
    expect(revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(29_000);
    expect(revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1_500);
    expect(revoke).toHaveBeenCalledWith('blob:x');
  });

  it('fällt bei abgebrochenem Teilen nicht auf Download zurück', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('abgebrochen', 'AbortError'));
    vi.stubGlobal('navigator', { canShare: () => true, share });
    const create = vi.spyOn(URL, 'createObjectURL');
    await expect(saveBackupFile(blob(), 'x.json')).resolves.toBeUndefined();
    expect(create).not.toHaveBeenCalled();
  });
});

it('lädt herunter, wenn das Teilen mit einem anderen Fehler scheitert', async () => {
  vi.useFakeTimers();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubGlobal('navigator', { canShare: () => true, share: vi.fn().mockRejectedValue(new DOMException('x', 'NotAllowedError')) });
  const create = (URL.createObjectURL = vi.fn(() => 'blob:y'));
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  await saveBackupFile(new Blob(['{}']), 'x.json');
  expect(create).toHaveBeenCalled();
});
