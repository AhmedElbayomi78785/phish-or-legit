import { useCallback, useEffect, useState } from 'react';
import { GameOver } from './components/GameOver';
import { MessageCard } from './components/MessageCard';
import { StatusBar } from './components/StatusBar';
import feed from './data/openphish.json';
import { makeGenerator } from './game/generator';
import { answer, isOver, levelFor, newGame } from './game/scoring';
import { addToGroup, getBest, saveBest } from './game/storage';

const nextMessage = makeGenerator(Math.random, feed.urls);

export default function App() {
  const [game, setGame] = useState(newGame);
  const [msg, setMsg] = useState(() => nextMessage(0));
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [over, setOver] = useState(false);
  const [best, setBest] = useState(getBest);
  const [newBest, setNewBest] = useState(false);
  const level = levelFor(game.right);

  const onAnswer = useCallback(
    (saidPhish: boolean) => {
      if (revealed || over) return;
      const result = answer(game, msg, saidPhish);
      setGame(result.state);
      setCorrect(result.correct);
      setRevealed(true);
    },
    [game, msg, revealed, over],
  );

  function next() {
    if (isOver(game)) {
      addToGroup(game.seen, game.right, game.fooledBy);
      const beat = game.score > best;
      if (beat) {
        saveBest(game.score);
        setBest(game.score);
      }
      setNewBest(beat);
      setOver(true);
      return;
    }
    setMsg(nextMessage(levelFor(game.right)));
    setRevealed(false);
    setCorrect(null);
  }

  function playAgain() {
    setGame(newGame());
    setMsg(nextMessage(0));
    setRevealed(false);
    setCorrect(null);
    setOver(false);
  }

  // arrow keys work too: left = phish, right = legit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onAnswer(true);
      if (e.key === 'ArrowRight') onAnswer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onAnswer]);

  return (
    <main className="wrap">
      <header>
        <h1>Phish <span className="or">or</span> Legit</h1>
        <p className="muted">Can you tell a scam from the real thing? Swipe left if it's phish, right if it's legit.</p>
      </header>

      <StatusBar game={game} level={level} />

      {over ? (
        <GameOver game={game} best={best} newBest={newBest} onPlayAgain={playAgain} />
      ) : (
        <>
          <MessageCard key={msg.id} msg={msg} number={game.seen + (revealed ? 0 : 1)} revealed={revealed} correct={correct} onAnswer={onAnswer} />
          <div className="choices">
            {revealed ? (
              <button className="next" onClick={next} autoFocus>
                {isOver(game) ? 'See my results' : 'Next message'}
              </button>
            ) : (
              <>
                <button className="choice phish" onClick={() => onAnswer(true)}>Phish</button>
                <button className="choice legit" onClick={() => onAnswer(false)}>Legit</button>
              </>
            )}
          </div>
          <p className="hint">Tip: drag the message left or right, or use the arrow keys.</p>
        </>
      )}

      <footer className="muted">
        Every company, person and phone number here is made up. Links marked as coming from OpenPhish are real phishing
        sites, so they're shown broken on purpose (hxxp and [.]) and can't be clicked.
      </footer>
    </main>
  );
}
