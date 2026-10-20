import { flagsIn } from './markup';
import type { Level, Message, Trick } from './types';

export const LIVES = 3;
export const LEVEL_NAMES = ['Obvious', 'Tricky', 'Sneaky'] as const;

export interface GameState {
  score: number;
  streak: number;
  bestStreak: number;
  lives: number;
  seen: number;
  right: number;
  fooledBy: Partial<Record<Trick, number>>; // scams you let through, counted by trick
  tooSuspicious: number; // real messages you called scams
}

export const newGame = (): GameState => ({
  score: 0, streak: 0, bestStreak: 0, lives: LIVES, seen: 0, right: 0, fooledBy: {}, tooSuspicious: 0,
});

// every 5 right answers the scams get harder, up to level 3
export const levelFor = (right: number): Level => Math.min(2, Math.floor(right / 5)) as Level;

export function answer(state: GameState, msg: Message, saidPhish: boolean): { state: GameState; correct: boolean } {
  const correct = saidPhish === msg.phish;
  const s: GameState = { ...state, fooledBy: { ...state.fooledBy }, seen: state.seen + 1 };
  if (correct) {
    s.right += 1;
    s.streak += 1;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    // base points, more for harder levels, plus a streak bonus capped at 10
    s.score += 10 + 5 * levelFor(state.right) + Math.min(s.streak, 10);
  } else {
    s.lives -= 1;
    s.streak = 0;
    if (msg.phish) {
      for (const f of flagsIn(msg.from, msg.replyTo, msg.url, ...msg.lines)) {
        s.fooledBy[f.trick] = (s.fooledBy[f.trick] ?? 0) + 1;
      }
    } else {
      s.tooSuspicious += 1;
    }
  }
  return { state: s, correct };
}

export const isOver = (s: GameState) => s.lives <= 0;

// the weak-spot report: tricks that fooled you, worst first
export const weakSpots = (fooledBy: Partial<Record<Trick, number>>) =>
  (Object.entries(fooledBy) as [Trick, number][]).sort((a, b) => b[1] - a[1]);

export function rank(right: number) {
  if (right >= 15) return 'Security pro';
  if (right >= 9) return 'Hard to fool';
  if (right >= 4) return 'Getting there';
  return 'Easy target';
}
