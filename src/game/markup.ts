import type { Trick } from './types';

// Red flags are written inline like this:  [[the text|why it's a red flag|Trick]]
// so the message reads normally until you answer, then the flags light up.

export const flag = (text: string, why: string, trick: Trick) => `[[${text}|${why}|${trick}]]`;

export type Segment = string | { text: string; why: string; trick: Trick };

// text and reason can't contain "|", but they can contain "]" (defanged links do)
const FLAG = /\[\[([^|]+)\|([^|]+)\|([^\]|]+)\]\]/g;

export function parse(s: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of s.matchAll(FLAG)) {
    if (m.index! > last) out.push(s.slice(last, m.index));
    out.push({ text: m[1], why: m[2], trick: m[3] as Trick });
    last = m.index! + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

export function flagsIn(...parts: (string | undefined)[]) {
  return parts.flatMap((p) => (p ? parse(p) : [])).filter((s): s is Exclude<Segment, string> => typeof s !== 'string');
}

export const plain = (s: string) => parse(s).map((x) => (typeof x === 'string' ? x : x.text)).join('');
