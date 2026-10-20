import { describe, expect, it } from 'vitest';
import { defang } from './defang';
import { flag, parse } from './markup';
import { answer, isOver, levelFor, newGame, weakSpots } from './scoring';
import type { Message } from './types';

const scam: Message = {
  id: 'a', phish: true, channel: 'email', fromName: 'X',
  from: flag('x@fake.co', 'wrong domain', 'Fake sender'),
  lines: [flag('buy gift cards', 'scam', 'Asks for money or gift cards')],
  url: flag('https://fake.co/login', 'lookalike', 'Lookalike link'),
};
const real: Message = { id: 'b', phish: false, channel: 'sms', from: '72265', lines: ['Your code is 123456.'], why: 'safe' };

describe('scoring', () => {
  it('gives points and builds a streak when you are right', () => {
    let s = newGame();
    s = answer(s, scam, true).state;
    s = answer(s, real, false).state;
    expect(s.right).toBe(2);
    expect(s.streak).toBe(2);
    expect(s.score).toBe(10 + 1 + 10 + 2);
  });

  it('takes a life and remembers which tricks fooled you', () => {
    const { state, correct } = answer(newGame(), scam, false);
    expect(correct).toBe(false);
    expect(state.lives).toBe(2);
    expect(state.fooledBy).toEqual({ 'Fake sender': 1, 'Asks for money or gift cards': 1, 'Lookalike link': 1 });
  });

  it('counts it when you call a real message a scam', () => {
    expect(answer(newGame(), real, true).state.tooSuspicious).toBe(1);
  });

  it('ends after 3 wrong answers', () => {
    let s = newGame();
    for (let i = 0; i < 3; i++) s = answer(s, real, true).state;
    expect(isOver(s)).toBe(true);
  });

  it('gets harder every 5 right answers and stops at level 3', () => {
    expect([0, 4, 5, 10, 50].map(levelFor)).toEqual([0, 0, 1, 2, 2]);
  });

  it('sorts the weak-spot report worst first', () => {
    expect(weakSpots({ 'Lookalike link': 1, 'Fake sender': 3 })[0]).toEqual(['Fake sender', 3]);
  });
});

describe('helpers', () => {
  it('splits a message into normal text and red flags', () => {
    expect(parse(`Hi ${flag('pay now', 'rush', 'Urgency and threats')}!`)).toEqual([
      'Hi ', { text: 'pay now', why: 'rush', trick: 'Urgency and threats' }, '!',
    ]);
  });

  it('defangs links so they cannot be clicked', () => {
    expect(defang('https://bad.example.com/login')).toBe('hxxps://bad[.]example[.]com/login');
  });
});
