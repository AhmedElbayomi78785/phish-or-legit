// Grabs real phishing links from the free OpenPhish community feed and saves a sample
// into src/data/openphish.json so the game can mix them in.
// Runs on its own before `npm run dev` and `npm run build`. If it can't reach the feed,
// it keeps whatever was saved last time and the game still works.

import { readFile, writeFile } from 'node:fs/promises';

const FEED = 'https://openphish.com/feed.txt';
const OUT = new URL('../src/data/openphish.json', import.meta.url);
const KEEP = 300;

function hostOf(u) {
  try {
    return new URL(u).hostname;
  } catch {
    return null;
  }
}

async function main() {
  let text;
  try {
    const res = await fetch(FEED, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`feed answered ${res.status}`);
    text = await res.text();
  } catch (err) {
    const old = JSON.parse(await readFile(OUT, 'utf8'));
    console.warn(`[openphish] couldn't get the feed (${err.message}). Keeping the ${old.urls.length} links saved before.`);
    return;
  }

  // one link per site so the game doesn't keep showing the same domain
  const seen = new Set();
  const urls = [];
  for (const line of text.split('\n').map((l) => l.trim())) {
    const host = hostOf(line);
    if (!host || seen.has(host) || line.includes('|')) continue;
    seen.add(host);
    urls.push(line);
  }
  // shuffle and keep a sample
  for (let i = urls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [urls[i], urls[j]] = [urls[j], urls[i]];
  }
  const sample = urls.slice(0, KEEP);
  await writeFile(OUT, JSON.stringify({ source: FEED, fetchedAt: new Date().toISOString(), urls: sample }, null, 2) + '\n');
  console.log(`[openphish] saved ${sample.length} real phishing links (from ${urls.length} unique sites)`);
}

main();
