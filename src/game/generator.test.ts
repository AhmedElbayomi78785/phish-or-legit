import { describe, expect, it } from 'vitest';
import { ALL_TRICKS, makeGenerator } from './generator';
import { flagsIn, plain } from './markup';
import type { Level } from './types';

// small seeded random so the tests give the same result every run
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sample = (n: number, feed: string[] = []) => {
  const next = makeGenerator(seeded(42), feed);
  return Array.from({ length: n }, (_, i) => next((i % 3) as Level));
};

const text = (m: ReturnType<typeof sample>[number]) => [m.from, m.subject, m.replyTo, m.url, ...m.lines].join('|');

describe('message generator', () => {
  it('makes 2,000+ different messages', () => {
    const unique = new Set(sample(5000).map(text));
    expect(unique.size).toBeGreaterThan(2000);
  });

  it('uses all 9 tricks', () => {
    const used = new Set(sample(3000).flatMap((m) => flagsIn(m.from, m.replyTo, m.url, ...m.lines).map((f) => f.trick)));
    expect(ALL_TRICKS).toHaveLength(9);
    for (const t of ALL_TRICKS) expect(used.has(t)).toBe(true);
  });

  it('every scam has at least one red flag and a MITRE ATT&CK id', () => {
    for (const m of sample(3000).filter((m) => m.phish)) {
      expect(flagsIn(m.from, m.replyTo, m.url, ...m.lines).length).toBeGreaterThan(0);
      expect(m.attack?.id).toMatch(/^T\d{4}(\.\d{3})?$/);
    }
  });

  it('real messages have no red flags and explain why they are safe', () => {
    for (const m of sample(3000).filter((m) => !m.phish)) {
      expect(flagsIn(m.from, m.replyTo, m.url, ...m.lines)).toHaveLength(0);
      expect(m.why).toBeTruthy();
    }
  });

  it('shows OpenPhish links defanged, never as a working link', () => {
    const feed = ['https://evil-login.example.ru/secure/verify', 'http://paypa1-check.example.top/x'];
    const fromFeed = sample(3000, feed).filter((m) => m.fromFeed);
    expect(fromFeed.length).toBeGreaterThan(0);
    for (const m of fromFeed) {
      const all = plain([m.url ?? '', ...m.lines].join(' '));
      expect(all).not.toMatch(/https?:\/\//);
      expect(all).toMatch(/hxxps?:\/\/|\[\.\]/);
    }
  });
});
