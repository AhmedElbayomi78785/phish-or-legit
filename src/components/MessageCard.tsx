import { useRef, useState, type PointerEvent } from 'react';
import { attackUrl } from '../game/attack';
import { PLAYER_EMAIL } from '../game/brands';
import { flagsIn } from '../game/markup';
import type { Message } from '../game/types';
import { Flagged } from './Flagged';

interface Props {
  msg: Message;
  number: number;
  revealed: boolean;
  correct: boolean | null;
  onAnswer: (saidPhish: boolean) => void;
}

const SWIPE = 90; // px you need to drag before it counts

export function MessageCard({ msg, number, revealed, correct, onAnswer }: Props) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<number | null>(null);

  const down = (e: PointerEvent<HTMLElement>) => {
    if (revealed) return;
    start.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLElement>) => {
    if (start.current !== null) setDx(e.clientX - start.current);
  };
  const up = () => {
    if (start.current === null) return;
    start.current = null;
    setDragging(false);
    if (Math.abs(dx) > SWIPE) onAnswer(dx < 0);
    setDx(0);
  };

  const flags = flagsIn(msg.from, msg.replyTo, msg.url, ...msg.lines);
  const tilt = revealed ? 0 : dx;

  return (
    <article
      className={`card ${revealed ? 'revealed' : ''} ${dragging ? 'dragging' : ''}`}
      style={{ transform: `translateX(${tilt}px) rotate(${tilt / 28}deg)` }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      aria-label={`Message ${number}`}
    >
      <span className="stamp phish" style={{ opacity: revealed ? (msg.phish ? 1 : 0) : Math.min(1, Math.max(0, -dx / SWIPE)) }}>PHISH</span>
      <span className="stamp legit" style={{ opacity: revealed ? (msg.phish ? 0 : 1) : Math.min(1, Math.max(0, dx / SWIPE)) }}>LEGIT</span>

      <div className="kind">
        <span>{msg.channel === 'sms' ? 'Text message' : 'Email'}</span>
        <span>Message {number}</span>
      </div>

      {msg.channel === 'sms' ? (
        <div className="sms">
          <div className="number">{msg.from}</div>
          <div className="bubble">{msg.lines.map((l, i) => <Flagged key={i} text={l} />)}</div>
        </div>
      ) : (
        <>
          <div className="headers">
            <div><span>From:</span> {msg.fromName} &lt;<Flagged text={msg.from} />&gt;</div>
            {msg.replyTo && <div><span>Reply-To:</span> <Flagged text={msg.replyTo} /></div>}
            <div><span>To:</span> {PLAYER_EMAIL}</div>
          </div>
          <p className="subject">{msg.subject}</p>
          <div className="body">{msg.lines.map((l, i) => <p key={i}><Flagged text={l} /></p>)}</div>
          {msg.url && (
            <>
              <span className="fake-button">{msg.cta ?? 'Open'}</span>
              <div className="url">Link goes to: <Flagged text={msg.url} /></div>
            </>
          )}
        </>
      )}

      {revealed && (
        <div className={`verdict ${correct ? 'right' : 'wrong'}`} role="status">
          <b>{correct ? 'Nice, you got it.' : 'Got you.'} {msg.phish ? "It's a scam." : "It's actually real."}</b>
          {msg.phish ? (
            <>
              Red flags, highlighted above:
              <ol>{flags.map((f, i) => <li key={i}>{f.why}</li>)}</ol>
              {msg.attack && (
                <p className="attack">
                  MITRE ATT&amp;CK:{' '}
                  <a href={attackUrl(msg.attack.id)} target="_blank" rel="noreferrer">{msg.attack.id} {msg.attack.name}</a>
                  {msg.fromFeed && ' · real link from the OpenPhish feed'}
                </p>
              )}
            </>
          ) : (
            msg.why
          )}
        </div>
      )}
    </article>
  );
}
