# Phish or Legit

A quick swipe game that trains you to spot phishing emails and scam texts. You get a message, you decide if it's a scam or real, and then it shows you exactly what gave it away.

## Why I made this

Most security training is a slideshow nobody remembers. I work in IT and I'm also an RA, and I kept seeing people fall for the same few tricks. Back at PepsiCo I trained 50+ operators on new systems and the one thing that always worked was keeping it and explaining stuff in one plain sentence. So I turned that into a game.

I ran it with the first-year students on my residence floor as a security activity. People got competitive with it, which honestly was the point Also a way to understand how to keep their accounts secured.

## How it plays

- Swipe left (or press ←) if it's **phish**, swipe right (or press →) if it's **legit**. Buttons work too.
- After every answer the red flags light up in the message and each one gets a one-line explanation.
- Scams also show their **MITRE ATT&CK** technique id, so you can see what security teams actually call that attack.
- You have 3 lives. Every 5 right answers the game gets harder:
  - **Obvious**: lots of red flags
  - **Tricky**: fewer clues
  - **Sneaky**: scams sound calm and normal, and real messages start sounding scary
- Right answers in a row give a streak bonus.
- When you're out of lives you get a **weak-spot report** showing which tricks fooled you the most, plus how many real messages you wrongly called scams.
- **Group results** add up every game played on the same device, so if a bunch of people take turns on one laptop you can see which tricks fooled the whole group.

## How it works

### The message generator

There's no fixed list of emails. Every round the generator builds a new message by mixing made-up companies, senders, fake links, scenarios and tricks. It makes 2,000+ different messages (there's a test for that), so you can't just memorize answers.

Fake links are built the same ways real scammers do it:

| Trick | Example |
|---|---|
| Extra words | `maplemobile-secure.com` |
| One letter swapped | `rnaplemobile.ca`, `halcy0nbank.ca` |
| Real name used as a decoy | `northgate.edu.login-help.xyz` |
| Wrong ending | `payflo.info` |

### The 9 tricks

Every red flag is tagged with one of these, which is what the weak-spot report counts:

1. Fake sender
2. Lookalike link
3. Urgency and threats
4. Asks for money or gift cards
5. Asks for passwords or bank info
6. Too good to be true
7. Bait file or curiosity
8. Asks you to keep it secret
9. Reply-To trick

### MITRE ATT&CK mapping

Each kind of scam is mapped to the technique security teams use for it (see `src/game/attack.ts`):

| Scam | ATT&CK |
|---|---|
| Fake login or payment page | T1598.003 Phishing for Information: Spearphishing Link |
| Fee or delivery link | T1566.002 Phishing: Spearphishing Link |
| "Shared file" bait | T1204.001 User Execution: Malicious Link |
| Fake boss or professor | T1656 Impersonation |
| Payroll asking for bank info | T1598 Phishing for Information |
| Scam texts | T1660 Phishing (Mobile) |

### Real phishing links from OpenPhish

`scripts/fetch-openphish.mjs` pulls the free [OpenPhish](https://openphish.com) community feed, keeps one link per site, and saves a sample of 300 into `src/data/openphish.json`. Some rounds use one of those real links.

These are live phishing sites, so the game never shows them as something you can click. They're "defanged" the way security people do it: `https://bad.com` becomes `hxxps://bad[.]com`.

The script runs on its own before `npm run dev` and `npm run build`. If it can't reach the feed, it keeps the last saved list and the game still works fine with just the generated links.

## Run it

You need Node 18 or newer.

```bash
npm install
npm run dev
```

Then open the link it prints (usually http://localhost:5173).

Other commands:

```bash
npm test          # run the tests
npm run build     # production build into dist/
npm run feed      # refresh the OpenPhish links by hand
```

## Tests

The game logic is tested with Vitest:

- the generator makes 2,000+ unique messages and uses all 9 tricks
- every scam has at least one red flag and a valid ATT&CK id
- real messages have no red flags and explain why they're safe
- OpenPhish links always come out defanged
- scoring, streaks, lives and difficulty levels work the way they should

## Built with

React, TypeScript, Vite and Vitest. No backend, everything runs in the browser and nothing you do gets sent anywhere.

## Heads up

Every company, person and phone number in the game is made up. The only real things are the OpenPhish links, and those are shown broken on purpose.

## What I'd add next

- A timer mode for when you want it to feel like a real inbox
- QR code scams, since those are everywhere now
- A shareable results card so people can compare scores
