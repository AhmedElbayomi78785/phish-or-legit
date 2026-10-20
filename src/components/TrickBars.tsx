import { weakSpots } from '../game/scoring';
import type { Trick } from '../game/types';

export function TrickBars({ fooledBy }: { fooledBy: Partial<Record<Trick, number>> }) {
  const rows = weakSpots(fooledBy);
  if (!rows.length) return null;
  const max = rows[0][1];
  return (
    <div className="bars">
      {rows.map(([trick, n]) => (
        <div className="bar" key={trick}>
          <span>{trick}</span>
          <div className="track"><i style={{ width: `${Math.round((100 * n) / max)}%` }} /></div>
          <span className="n">{n}</span>
        </div>
      ))}
    </div>
  );
}
