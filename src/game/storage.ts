import type { Trick } from './types';

// Saves your best score, plus "group results" for when a bunch of people take turns
// on the same laptop (that's how I ran it with my residence floor).
// Everything stays in this browser. Nothing gets sent anywhere.

const BEST = 'pol-best';
const GROUP = 'pol-group';

export interface GroupStats {
  games: number;
  messages: number;
  right: number;
  fooledBy: Partial<Record<Trick, number>>;
}

const emptyGroup = (): GroupStats => ({ games: 0, messages: 0, right: 0, fooledBy: {} });

function read<X>(key: string, fallback: X): X {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as X) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode or storage blocked, the game still works
  }
}

export const getBest = () => read<number>(BEST, 0);
export const saveBest = (score: number) => write(BEST, score);

export const getGroup = () => read<GroupStats>(GROUP, emptyGroup());
export const resetGroup = () => write(GROUP, emptyGroup());

export function addToGroup(seen: number, right: number, fooledBy: Partial<Record<Trick, number>>) {
  const g = getGroup();
  g.games += 1;
  g.messages += seen;
  g.right += right;
  for (const [t, n] of Object.entries(fooledBy) as [Trick, number][]) g.fooledBy[t] = (g.fooledBy[t] ?? 0) + n;
  write(GROUP, g);
  return g;
}
