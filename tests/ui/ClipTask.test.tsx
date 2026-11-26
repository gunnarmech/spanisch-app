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
  it('zieht nur aus Clips mit höchstens zwei Wörtern Abstand, nicht aus fernen', () => {
    // c3 hat 4 Tokens: c5 (4), c1 (4), c2 (2, Abstand 2) kommen in Frage, c4 (1, Abstand 3) nicht.
    const near = new Set(['hör mal, verstehst du, dass er kam', 'ich komme sofort sofort', 'na klar']);
    for (const r of [0, 0.3, 0.6, 0.99]) {
      const o = clipOptions(clips[2], clips, () => r);
      expect(o).toHaveLength(3);
      expect(o).toContain('wie langweilig das ist');
      expect(o.filter((x) => x !== 'wie langweilig das ist').every((x) => near.has(x))).toBe(true);
    }
  });

  it('erweitert den Abstand, wenn zu wenige Kandidaten da sind', () => {
    const o = clipOptions(clips[3], clips, () => 0);
    expect(o).toHaveLength(3);
    expect(o).toContain('toll');
  });

  it('lässt gleiche Übersetzungen aus', () => {
    const dup = [clip('c6', 'qué fome', 'wie langweilig das ist'), ...clips];
    const o = clipOptions(clips[2], dup, () => 0);
    expect(new Set(o).size).toBe(o.length);
    expect(o).toHaveLength(3);
  });

  it('liefert bei vielen gleich langen Clips über mehrere Aufgaben viele verschiedene Ablenker', () => {
    const many = Array.from({ length: 60 }, (_, i) => clip(`m${i}`, `uno dos tres ${i}`, `übersetzung ${i}`));
    let seed = 7;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    const wrong = new Set<string>();
    for (let k = 0; k < 20; k++) {
      for (const o of clipOptions(many[0], many, rand)) if (o !== many[0].de) wrong.add(o);
    }
    expect(wrong.size).toBeGreaterThan(10);
  });

  it('ClipTask bleibt innerhalb einer Aufgabe stabil, auch bei neuem Rendern', () => {
    const rand = vi.fn(() => Math.random());
    const { rerender } = render(<ClipTask clip={clips[2]} clips={clips} url="x.mp3" rand={rand} onDone={() => {}} />);
    const first = screen.getAllByRole('button', { name: /^\d/ }).map((b) => b.textContent);
    const calls = rand.mock.calls.length;
    rerender(<ClipTask clip={clips[2]} clips={clips} url="x.mp3" rand={rand} onDone={() => {}} />);
    expect(screen.getAllByRole('button', { name: /^\d/ }).map((b) => b.textContent)).toEqual(first);
    expect(rand.mock.calls.length).toBe(calls);
  });
});
