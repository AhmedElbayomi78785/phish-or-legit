import { parse } from '../game/markup';

// Shows text normally, and once you've answered, highlights the red flags in it.
export function Flagged({ text }: { text: string }) {
  return (
    <>
      {parse(text).map((seg, i) =>
        typeof seg === 'string' ? (
          <span key={i}>{seg}</span>
        ) : (
          <mark key={i} className="flag" title={seg.why}>
            {seg.text}
          </mark>
        ),
      )}
    </>
  );
}
