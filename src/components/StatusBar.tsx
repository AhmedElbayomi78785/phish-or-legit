import { LEVEL_NAMES, LIVES, type GameState } from '../game/scoring';
import type { Level } from '../game/types';

export function StatusBar({ game, level }: { game: GameState; level: Level }) {
  const lives = Math.max(0, game.lives);
  return (
    <div className="status" aria-live="polite">
      <div className="stat"><b>{game.score}</b><span>Score</span></div>
      <div className="stat"><b>{game.streak}</b><span>Streak</span></div>
      <div className="stat"><b>{level + 1}</b><span>Level · {LEVEL_NAMES[level]}</span></div>
      <div className="stat lives">
        <b aria-label={`${lives} lives left`}>{'♥'.repeat(lives)}{'♡'.repeat(LIVES - lives)}</b>
        <span>Lives</span>
      </div>
    </div>
  );
}
