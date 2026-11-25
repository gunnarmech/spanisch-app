/**
 * Gibt die Sicherung aus: bevorzugt über das Teilen-Menü (iOS gibt blob-URLs nach dem Klick sofort wieder frei),
 * sonst als Download, dessen URL erst nach 30 Sekunden freigegeben wird.
 */
export async function saveBackupFile(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: blob.type || 'application/json' });
  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (err) {
      // Abbruch ist keine Störung; bei anderen Fehlern bleibt der Download.
      if ((err as Error).name === 'AbortError') return;
      console.warn('Teilen fehlgeschlagen, lade herunter', err);
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
