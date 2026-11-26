import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ChileClip } from '../../src/content/types';
import { ClipTask, clipOptions } from '../../src/ui/tasks/ClipTask';

afterEach(cleanup);

const clip = (id: string, es: string, de: string): ChileClip => ({ id, es, de, gender: 'f', source: 'test' });
const clips = [
  clip('c1', 'oye cachai que llegó', 'hör mal, verstehst du, dass er kam'),
  clip('c2', 'ya po', 'na klar'),
  clip('c3', 'qué fome está esto', 'wie langweilig das ist'),
  clip('c4', 'bacán', 'toll'),
  clip('c5', 'voy al tiro altiro', 'ich komme sofort sofort'),
];

describe('ClipTask', () => {
  it('zeigt vor der Antwort keinen spanischen Text', () => {
    render(<ClipTask clip={clips[2]} clips={clips} url="x.mp3" onDone={() => {}} />);
    expect(screen.getByText('Chile hören')).toBeTruthy();
    expect(screen.getByText('Echte Aufnahme aus Chile')).toBeTruthy();
    expect(screen.queryByText('qué fome está esto')).toBeNull();
    expect(screen.getAllByRole('button', { name: /^\d/ })).toHaveLength(3);
  });

  it('nach Wahl Text und Übersetzung sichtbar', () => {
    render(<ClipTask clip={clips[2]} clips={clips} url="x.mp3" onDone={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /wie langweilig das ist/ }));
    expect(screen.getByText('qué fome está esto')).toBeTruthy();
    expect(screen.getAllByText('wie langweilig das ist').length).toBeGreaterThan(1);
    expect(screen.getByRole('button', { name: 'Nochmal hören' })).toBeTruthy();
  });

  it('falsche Wahl meldet die Antwort als falsch, einmal', () => {
    const onAnswered = vi.fn();
    render(<ClipTask clip={clips[2]} clips={clips} url="x.mp3" onAnswered={onAnswered} onDone={() => {}} />);
    fireEvent.click(screen.getAllByRole('button', { name: /hör mal|ich komme/ })[0]);
    expect(onAnswered).toHaveBeenCalledTimes(1);
    expect(onAnswered.mock.calls[0][0].verdict).toBe('wrong');
  });
});

describe('clipOptions', () => {
  it('nimmt die zwei Clips mit der geringsten Differenz der Tokenzahl, stabil', () => {
    // c3 hat 4 Tokens: c5 (4) Differenz 0, c1 (4) Differenz 0, c2 (2) Differenz 2, c4 (1) Differenz 3
    const o = clipOptions(clips[2], clips, () => 0);
    expect([...o].sort()).toEqual(
      ['hör mal, verstehst du, dass er kam', 'ich komme sofort sofort', 'wie langweilig das ist'].sort(),
    );
  });
  it('lässt gleiche Übersetzungen aus', () => {
    const dup = [clip('c6', 'qué fome', 'wie langweilig das ist'), ...clips];
    const o = clipOptions(clips[2], dup, () => 0);
    expect(new Set(o).size).toBe(o.length);
    expect(o).toHaveLength(3);
  });
});
