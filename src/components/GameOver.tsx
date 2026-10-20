import { useState } from 'react';
import { rank, type GameState } from '../game/scoring';
import { getGroup, resetGroup, type GroupStats } from '../game/storage';
import { TrickBars } from './TrickBars';

interface Props {
  game: GameState;
  best: number;
  newBest: boolean;
  onPlayAgain: () => void;
}

export function GameOver({ game, best, newBest, onPlayAgain }: Props) {
  const [group, setGroup] = useState<GroupStats>(getGroup());
  const [confirmReset, setConfirmReset] = useState(false);
  const accuracy = game.seen ? Math.round((100 * game.right) / game.seen) : 0;
  const groupAccuracy = group.messages ? Math.round((100 * group.right) / group.messages) : 0;
  const fooled = Object.keys(game.fooledBy).length > 0;

  return (
    <div className="over">
      <h2>{rank(game.right)}</h2>
      <p className="muted">{newBest ? 'New personal best!' : best ? `Your best is ${best}.` : 'Out of lives.'}</p>

      <div className="grid">
        <div className="stat"><b>{game.score}</b><span>Final score</span></div>
        <div className="stat"><b>{game.right} / {game.seen}</b><span>Right ({accuracy}%)</span></div>
        <div className="stat"><b>{game.bestStreak}</b><span>Best streak</span></div>
      </div>

      <h3>{fooled ? 'Tricks that got you' : 'No scam got past you.'}</h3>
      <TrickBars fooledBy={game.fooledBy} />
      {game.tooSuspicious > 0 && (
        <p className="muted">
          You also called {game.tooSuspicious} real message{game.tooSuspicious > 1 ? 's' : ''} a scam. Being too
          suspicious means missing stuff that actually matters.
        </p>
      )}

      <button className="next" onClick={onPlayAgain} autoFocus>Play again</button>

      <section className="group">
        <h3>Group results on this device</h3>
        <p className="muted">
          {group.games} game{group.games === 1 ? '' : 's'} played, {group.messages} messages, {groupAccuracy}% right.
          Handy when a few people take turns on one laptop.
        </p>
        <TrickBars fooledBy={group.fooledBy} />
        {confirmReset ? (
          <div className="row">
            <span className="muted">Clear the group results?</span>
            <button className="small danger" onClick={() => { resetGroup(); setGroup(getGroup()); setConfirmReset(false); }}>Yes, clear</button>
            <button className="small" onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        ) : (
          group.games > 0 && <button className="small" onClick={() => setConfirmReset(true)}>Reset group results</button>
        )}
      </section>
    </div>
  );
}
