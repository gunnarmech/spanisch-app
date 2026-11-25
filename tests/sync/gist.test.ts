import { describe, it, expect, vi } from 'vitest';
import { openDb, type Db } from '../../src/store/db';
import { mergeEvents, syncNow } from '../../src/sync/gist';
import { replay, type ReviewEvent } from '../../src/engine/state';

let n = 0;
const fresh = () => openDb(`gist-${Date.now()}-${n++}`);
const ev = (id: string, ts: number, cardId = 'c1'): ReviewEvent => ({ id, cardId, ts, device: 'd', kind: 'known' });
const rev = (id: string, ts: number, cardId: string): ReviewEvent => ({ id, cardId, ts, device: 'd', kind: 'review', rating: 3, stage: 1 });

type Gist = { id: string; description: string; files: Record<string, { content: string }> };

/** Minimaler GitHub-Gist-Server als fetch. */
function fakeGithub(gists: Gist[] = [], opts: { status?: number } = {}) {
  const calls: { method: string; url: string; headers: Record<string, string>; body?: string }[] = [];
  const impl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const headers = init?.headers as Record<string, string>;
    calls.push({ method, url, headers, body: init?.body as string | undefined });
    const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status });
    if (opts.status) return json({ message: 'Bad credentials' }, opts.status);
    const path = new URL(url).pathname;
    if (method === 'GET' && path === '/gists') return json(gists.map((g) => ({ id: g.id, description: g.description })));
    if (method === 'POST' && path === '/gists') {
      const b = JSON.parse(init!.body as string);
      const g = { id: `g${gists.length + 1}`, description: b.description, files: b.files };
      gists.push(g);
      return json(g, 201);
    }
    const m = path.match(/^\/gists\/(\w+)$/);
    const g = m && gists.find((x) => x.id === m[1]);
    if (!g) return json({ message: 'Not Found' }, 404);
    if (method === 'GET') return json(g);
    if (method === 'PATCH') {
      Object.assign(g.files, JSON.parse(init!.body as string).files);
      return json(g);
    }
    return json({}, 400);
  });
  return { impl: impl as unknown as typeof fetch, calls, gists };
}

async function withToken(db: Db, extra: object = {}) {
  await db.saveSettings({ ...(await db.getSettings()), gistToken: 'tok', ...extra });
}

describe('mergeEvents', () => {
  it('vereinigt ohne Duplikate und sortiert nach ts und id', () => {
    const out = mergeEvents([ev('b', 2), ev('a', 2), ev('x', 1)], [ev('a', 2), ev('c', 0)]);
    expect(out.map((e) => e.id)).toEqual(['c', 'x', 'a', 'b']);
  });
});

describe('syncNow', () => {
  it('tut ohne Token nichts und ruft fetch nicht auf', async () => {
    const db = await fresh();
    const gh = fakeGithub();
    expect(await syncNow(db, gh.impl)).toEqual({ added: 0, pushed: 0 });
    expect(gh.impl).not.toHaveBeenCalled();
  });

  it('legt ohne Gist ein geheimes an und merkt sich die id', async () => {
    const db = await fresh();
    await withToken(db);
    await db.addEvents([ev('a', 1)]);
    const gh = fakeGithub();
    expect(await syncNow(db, gh.impl)).toEqual({ added: 0, pushed: 1 });
    const post = gh.calls.find((c) => c.method === 'POST')!;
    const body = JSON.parse(post.body!);
    expect(body).toMatchObject({ public: false, description: 'spanisch-app sync' });
    expect(JSON.parse(body.files['spanisch-app-log.json'].content)).toMatchObject({ version: 1, events: [{ id: 'a' }] });
    expect(post.headers).toMatchObject({
      Authorization: 'Bearer tok',
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    });
    const s = await db.getSettings();
    expect(s.gistId).toBe('g1');
    expect(typeof s.lastSync).toBe('number');
  });

  it('findet ein vorhandenes Gist über die Beschreibung', async () => {
    const db = await fresh();
    await withToken(db);
    const file = { content: JSON.stringify({ version: 1, events: [ev('r', 5)] }) };
    const gh = fakeGithub([
      { id: 'other', description: 'etwas anderes', files: {} },
      { id: 'mine', description: 'spanisch-app sync', files: { 'spanisch-app-log.json': file } },
    ]);
    expect(await syncNow(db, gh.impl)).toEqual({ added: 1, pushed: 0 });
    expect(gh.calls.some((c) => c.method === 'POST')).toBe(false);
    expect((await db.getSettings()).gistId).toBe('mine');
    expect((await db.allEvents()).map((e) => e.id)).toEqual(['r']);
  });

  it('liest abgeschnittene Dateien über raw_url', async () => {
    const db = await fresh();
    await withToken(db, { gistId: 'big' });
    const content = JSON.stringify({ version: 1, events: [ev('r', 5)] });
    const impl = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === 'https://raw.example/log') return new Response(content);
      const file = { truncated: true, content: '{"vers', raw_url: 'https://raw.example/log' };
      return new Response(JSON.stringify({ id: 'big', files: { 'spanisch-app-log.json': file } }));
    }) as unknown as typeof fetch;
    expect(await syncNow(db, impl)).toEqual({ added: 1, pushed: 0 });
  });

  it('bringt zwei Geräte nach je einem Abgleich zum gleichen replay', async () => {
    const gh = fakeGithub();
    const a = await fresh();
    const b = await fresh();
    await withToken(a);
    await withToken(b);
    await a.addEvents([rev('a1', 1000, 'c1'), rev('a2', 3000, 'c2')]);
    await b.addEvents([rev('b1', 2000, 'c1'), ev('b2', 4000, 'c3')]);
    await syncNow(a, gh.impl);
    await syncNow(b, gh.impl);
    await syncNow(a, gh.impl);
    const ids = new Set(['c1', 'c2', 'c3']);
    const ea = await a.allEvents();
    const eb = await b.allEvents();
    expect(ea).toHaveLength(4);
    expect(replay(ea, ids, 0.9)).toEqual(replay(eb, ids, 0.9));
  });

  it('schreibt nichts, wenn sich nichts geändert hat', async () => {
    const db = await fresh();
    await withToken(db);
    await db.addEvents([ev('a', 1)]);
    const gh = fakeGithub();
    await syncNow(db, gh.impl);
    gh.calls.length = 0;
    expect(await syncNow(db, gh.impl)).toEqual({ added: 0, pushed: 0 });
    expect(gh.calls.some((c) => c.method === 'PATCH' || c.method === 'POST')).toBe(false);
  });

  it('meldet 401 als Fehler mit Token im Text und wirft nicht', async () => {
    const db = await fresh();
    await withToken(db);
    const res = await syncNow(db, fakeGithub([], { status: 401 }).impl);
    expect('error' in res && res.error).toContain('Token');
  });

  it('gibt jeder Anfrage ein Zeitlimit mit', async () => {
    const db = await fresh();
    await withToken(db);
    const gh = fakeGithub();
    await syncNow(db, gh.impl);
    for (const [, init] of (gh.impl as unknown as { mock: { calls: [unknown, RequestInit][] } }).mock.calls) {
      expect(init.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it('meldet Netzfehler auf Deutsch', async () => {
    const db = await fresh();
    await withToken(db);
    const impl = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    const res = await syncNow(db, impl);
    expect('error' in res && res.error).toContain('Verbindung');
  });

  it('überschreibt ein Gist mit ungültigem Inhalt nicht', async () => {
    const db = await fresh();
    await withToken(db);
    const bad = '{"version":1,"events":[{"id":1}]}';
    const gh = fakeGithub([{ id: 'mine', description: 'spanisch-app sync', files: { 'spanisch-app-log.json': { content: bad } } }]);
    const res = await syncNow(db, gh.impl);
    expect('error' in res).toBe(true);
    expect(gh.calls.some((c) => c.method === 'PATCH')).toBe(false);
    expect(gh.gists[0].files['spanisch-app-log.json'].content).toBe(bad);
  });
});
