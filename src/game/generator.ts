import { ATTACK } from './attack';
import { BRANDS, FIRST, LAST, byName, type Brand } from './brands';
import { defang, hostOf } from './defang';
import { flag } from './markup';
import type { Level, Message, Trick } from './types';

// Builds a new scam (or a real message) every round by mixing companies, senders,
// fake links and tricks. That's why you almost never see the same message twice.

export type Rng = () => number;

const T = {
  sender: 'Fake sender',
  link: 'Lookalike link',
  pressure: 'Urgency and threats',
  money: 'Asks for money or gift cards',
  creds: 'Asks for passwords or bank info',
  prize: 'Too good to be true',
  bait: 'Bait file or curiosity',
  secret: 'Asks you to keep it secret',
  reply: 'Reply-To trick',
} as const satisfies Record<string, Trick>;

export const ALL_TRICKS = Object.values(T) as Trick[];

export function makeGenerator(rng: Rng = Math.random, feedUrls: string[] = []) {
  let n = 0;
  const pick = <X,>(a: readonly X[]): X => a[Math.floor(rng() * a.length)];
  const chance = (p: number) => rng() < p;
  const int = (lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
  const person = () => `${pick(FIRST)} ${pick(LAST)}`;
  const phone = () => `+1 (902) 555-0${int(100, 999)}`;
  const fee = () => pick(['0.99', '1.99', '2.49', '3.00']);
  const deadline = () => pick(['24 hours', '12 hours', '48 hours', 'tonight']);
  const path = () => pick(['/login', '/verify', '/account/update', '/secure/session', '/claim', '/pay']);
  const id = () => `m${++n}`;

  // swaps one letter so "maplemobile" becomes "map1emobile" and so on
  function typo(base: string): string {
    const swaps = ([['m', 'rn'], ['l', '1'], ['o', '0'], ['i', 'l'], ['e', '3'], ['a', '4']] as const).filter(([a]) => base.includes(a));
    if (swaps.length && chance(0.7)) {
      const [a, b] = pick(swaps);
      const at = base.indexOf(a);
      return base.slice(0, at) + b + base.slice(at + 1);
    }
    const i = int(1, base.length - 2);
    return chance(0.5) ? base.slice(0, i) + base[i] + base.slice(i) : base.slice(0, i) + base[i + 1] + base[i] + base.slice(i + 2);
  }

  function fakeDomain(b: Brand): { domain: string; why: string } {
    const base = b.domain.split('.')[0];
    const tld = b.domain.slice(base.length);
    const kind = int(0, 3);
    if (kind === 0) {
      const domain = `${base}-${pick(['secure', 'support', 'verify', 'account', 'help'])}${pick(['.com', '.net', '.co'])}`;
      return { domain, why: `Extra words make it a whole different website. The real one is ${b.domain}.` };
    }
    if (kind === 1) {
      let t = typo(base);
      if (t === base) t = base + 's';
      return { domain: t + tld, why: `Look close, one letter is off. The real address is ${b.domain}.` };
    }
    if (kind === 2) {
      const evil = pick(['account-check.ru', 'login-help.xyz', 'verify-now.info', 'secure-portal.top']);
      return { domain: `${b.domain}.${evil}`, why: `The real website is the end part, ${evil}. The ${b.domain} in front is just a decoy.` };
    }
    return { domain: base + pick(['.co', '.info', '.site', '.online']), why: `Wrong ending. The real address is ${b.domain}.` };
  }

  // ---------- scams ----------

  function brandEmail(level: Level): Message {
    const subtle = level === 2;
    const urgent = (calm: string, loud: string, why: string) => (subtle ? calm : flag(loud, why, T.pressure));
    const scenarios: (() => Omit<Message, 'id' | 'phish' | 'channel' | 'from' | 'url'> & { brand?: Brand })[] = [
      () => {
        const b = pick(BRANDS);
        return {
          brand: b,
          subject: subtle ? `Please confirm your ${b.short} account details` : `URGENT: Your ${b.short} account is suspended`,
          lines: [
            'Hello,',
            `We noticed unusual activity on your account. ${urgent('Please review your details when you get a chance.', `Verify within ${deadline()} or your account will be closed`, 'Deadlines and threats are there to rush you.')}.`,
            subtle ? 'Sign in with the button below to keep your account active.'
              : `${flag('Confirm your password and security questions', 'Real companies never ask for your password over email.', T.creds)} on the secure page below.`,
          ],
          cta: 'Review account',
          attack: ATTACK.credsLink,
        };
      },
      () => {
        const b = pick(BRANDS);
        return {
          brand: b,
          subject: `${b.short}: payment failed`,
          lines: [
            `Hi ${pick(FIRST)},`,
            `We couldn't process your last payment. ${urgent('You can update your card any time.', 'Your service stops tonight', 'Threatening to cut you off is a pressure trick.')}.`,
            subtle ? 'Update your payment method with the link below.'
              : `${flag('Type in your full card number and CVV', 'No company asks for full card details through an email link.', T.creds)} to avoid any interruption.`,
          ],
          cta: 'Update payment',
          attack: ATTACK.credsLink,
        };
      },
      () => ({
        brand: byName('ParcelDash'),
        subject: 'Your parcel is on hold',
        lines: [
          'We tried to deliver your package today.',
          `A ${flag(`small fee of $${fee()}`, 'Tiny surprise fees are a common way to grab card numbers.', T.money)} is needed before we try again.`,
          urgent('Pick a new delivery time below.', `Unclaimed parcels go back in ${deadline()}`, 'A countdown is there to make you act fast.'),
        ],
        cta: 'Pay and reschedule',
        attack: ATTACK.link,
      }),
      () => ({
        brand: byName('CloudBox'),
        subject: `${person()} shared "${pick(['Salary_Review_2026.xlsx', 'Layoff_List_Q4.pdf', 'Exam_Answers_Final.docx', 'Bonus_Payments.xlsx'])}" with you`,
        lines: [
          'You have a new shared file.',
          `${flag('Open it before the link expires', 'A juicy file name plus a deadline is bait so you click without thinking.', T.bait)}.`,
        ],
        cta: 'Open file',
        attack: ATTACK.maliciousLink,
      }),
      () => {
        const b = pick(BRANDS);
        return {
          brand: b,
          subject: subtle ? 'Your password expires soon' : 'Password EXPIRED, action required',
          lines: [
            `Your ${b.short} password ${subtle ? 'expires in 3 days' : flag('expired today', 'Fake expiry warnings are a classic way to steal passwords.', T.pressure)}.`,
            'Keep your current password by signing in below.',
          ],
          cta: 'Keep my password',
          attack: ATTACK.credsLink,
        };
      },
      () => {
        const b = pick(BRANDS);
        return {
          brand: b,
          subject: subtle ? 'A refund is waiting on your account' : "Congrats! You've won a $500 gift card",
          lines: [
            subtle ? 'Our records show you were overcharged on your last bill.'
              : `${flag('You were picked as our winner', "Surprise prizes for contests you never entered are almost always scams.", T.prize)}.`,
            `To get it, ${flag('enter your banking details', 'A refund or prize never needs your bank login.', T.creds)} on the claim page.`,
          ],
          cta: 'Claim now',
          attack: ATTACK.credsLink,
        };
      },
    ];
    const s = pick(scenarios)();
    const b = s.brand ?? pick(BRANDS);
    const fake = fakeDomain(b);
    const spoofedButReal = subtle && chance(0.5);
    const fromAddr = spoofedButReal ? `no-reply@${b.domain}` : `${pick(['support', 'security', 'alerts', 'billing', 'team'])}@${fake.domain}`;
    return {
      id: id(), phish: true, channel: 'email',
      fromName: b.name,
      from: spoofedButReal ? fromAddr : flag(fromAddr, `It came from ${fake.domain}, not ${b.domain}.`, T.sender),
      subject: s.subject, lines: s.lines, cta: s.cta, attack: s.attack,
      url: flag(`https://${fake.domain}${path()}`, fake.why, T.link),
    };
  }

  function personEmail(): Message {
    const boss = person();
    const [first, last] = boss.toLowerCase().split(' ');
    const options: Omit<Message, 'id' | 'phish' | 'channel'>[] = [
      {
        fromName: `${boss} (CEO)`,
        from: flag(`${first}.${last}.ceo@${pick(['gmail.com', 'outlook-mail.net', 'proton-box.me'])}`, "A boss wouldn't use a personal email for work requests.", T.sender),
        subject: 'Quick favour',
        lines: [
          'Are you at your desk?',
          `I need you to ${flag(`buy ${int(3, 5)} gift cards`, 'Gift card requests are one of the most common scams out there.', T.money)} for a client meeting today.`,
          `${flag('Keep this between us', 'Asking you to keep it secret is a huge red flag.', T.secret)}, I'm in meetings all afternoon.`,
        ],
        attack: ATTACK.impersonation,
      },
      {
        fromName: 'Northgate Payroll',
        from: 'payroll@northgate.edu',
        replyTo: flag('payroll-update@northgate-hr.net', 'The sender looks real, but your reply would go to an outside address.', T.reply),
        subject: 'Action needed: update your direct deposit',
        lines: [
          'Our payroll system is moving to a new provider.',
          `Please reply with your ${flag('bank account and transit numbers', 'Payroll never collects banking details over email.', T.creds)} before Friday so your pay isn't delayed.`,
        ],
        attack: ATTACK.infoByEmail,
      },
      {
        fromName: `Prof. ${boss}`,
        from: flag(`prof.${last}@${pick(['northgate-edu.com', 'northgate.co'])}`, 'Northgate professors use @northgate.edu addresses.', T.sender),
        subject: 'Paid research assistant role',
        lines: [
          `I saw your profile and I'd like to offer you a remote job, ${flag('$450 a week for 2 hours of work', 'Pay way too high for the work is a classic job scam.', T.prize)}.`,
          `I'll mail you a cheque for equipment, then you ${flag('send the extra back by e-transfer', 'Overpay-then-refund is a well known cheque scam.', T.money)}.`,
        ],
        attack: ATTACK.impersonation,
      },
    ];
    return { id: id(), phish: true, channel: 'email', ...pick(options) };
  }

  function scamText(): Message {
    const b = pick(BRANDS);
    const fake = fakeDomain(b);
    const parcel = fakeDomain(byName('ParcelDash'));
    const mobile = fakeDomain(byName('Maple Mobile'));
    const texts = [
      `${b.short}: Your account is locked. ${flag('Unlock it now', 'Texts pushing you to "unlock" an account are a common scam.', T.pressure)} at ${flag(`${fake.domain}/u`, fake.why, T.link)}`,
      `ParcelDash: package #${int(100000, 999999)} is waiting. ${flag(`Pay $${fee()} shipping`, 'Small surprise fees are used to steal card numbers.', T.money)}: ${flag(`${parcel.domain}/p`, parcel.why, T.link)}`,
      `Maple Mobile: ${flag('you have a $75 loyalty reward', 'Rewards you never asked for are bait.', T.prize)}. Claim before midnight: ${flag(`${mobile.domain}/r`, mobile.why, T.link)}`,
      `Hi it's ${pick(FIRST)}, I lost my phone and this is my new number. ${flag('Can you send me $200 on Payflo?', 'A "friend with a new number" asking for money is a really common scam.', T.money)} I'll pay you back tonight`,
    ];
    return { id: id(), phish: true, channel: 'sms', from: phone(), lines: [pick(texts)], attack: ATTACK.mobile };
  }

  // a real link that was reported on OpenPhish, shown defanged so it can't be clicked
  function feedMessage(): Message {
    const url = pick(feedUrls);
    const shown = defang(url);
    const host = hostOf(url);
    const why = `This is a real phishing link reported to OpenPhish. The site is ${host.replace(/\./g, '[.]')}, which has nothing to do with the company in the message.`;
    if (chance(0.5)) {
      return {
        id: id(), phish: true, channel: 'sms', from: phone(), fromFeed: true,
        lines: [`${pick(['Your account has been limited', 'We could not verify your identity', 'Unusual sign-in blocked'])}. ${flag('Confirm your details today', 'Pushing you to act today is a pressure trick.', T.pressure)}: ${flag(shown, why, T.link)}`],
        attack: ATTACK.mobile,
      };
    }
    const b = pick(BRANDS);
    return {
      id: id(), phish: true, channel: 'email', fromFeed: true,
      fromName: `${b.name} Security`,
      from: flag(`security@${host}`, `The sender's address is on ${host.replace(/\./g, '[.]')}, not ${b.domain}.`, T.sender),
      subject: 'Action required on your account',
      lines: ['We detected a problem with your account information.', `Please ${flag('sign in and confirm your details', 'They want your login. That is the whole point of the email.', T.creds)} to avoid limits on your account.`],
      cta: 'Confirm details',
      url: flag(shown, why, T.link),
      attack: ATTACK.credsLink,
    };
  }

  // ---------- real messages ----------

  function realEmail(level: Level): Message {
    const b = pick(BRANDS);
    const bank = byName('Halcyon');
    const school = byName('Northgate');
    const options: { brand: Brand; from?: string; subject: string; lines: string[]; cta?: string; url?: string; why: string }[] = [
      { brand: bank, subject: 'Your monthly e-statement is ready',
        lines: ['Your statement is ready to view.', 'For your safety we never put links in these emails. Open the Halcyon app or type halcyonbank.ca yourself to sign in.'],
        why: "No link, doesn't ask for anything, and tells you to go to the site yourself." },
      { brand: school, from: 'library@northgate.edu', subject: `Reminder: ${int(1, 3)} items due Friday`,
        lines: ['Some items on your library account are due this Friday.', 'You can renew them once from your library account.'],
        cta: 'View my account', url: 'https://library.northgate.edu/account',
        why: 'The sender and the link both use the real northgate.edu, and nothing is urgent or secret.' },
      { brand: b, subject: `Your ${b.short} receipt`,
        lines: [`Thanks for your order. Order #${int(10000, 99999)}, total $${(5 + rng() * 60).toFixed(2)}.`, 'You can see your order history in your account.'],
        cta: 'View order', url: `https://${b.domain}/orders`,
        why: `The link goes to the real ${b.domain} and it doesn't ask you for anything.` },
      { brand: b, subject: `Your ${b.short} sign-in code`,
        lines: [`Your code is ${int(100000, 999999)}.`, "If you didn't try to sign in, just ignore this email. We'll never call you to ask for this code."],
        why: "It's a code you asked for, it warns you not to share it, and there's no link." },
      level >= 1
        ? { brand: b, subject: `New sign-in to your ${b.short} account`,
            lines: ['We noticed a new sign-in from Chrome on Windows in Halifax, NS.', `If this was you, you're all good. If not, open the ${b.short} app and change your password from Settings.`],
            why: "Sounds scary, but there's no link, it asks for nothing, and it tells you to use the app yourself. That's how real security alerts work." }
        : { brand: b, subject: `Welcome to ${b.short}`,
            lines: [`Thanks for making an account with ${b.name}.`, 'You can change your settings any time in your account.'],
            why: 'A normal welcome email from the real domain with nothing asked of you.' },
      { brand: school, from: 'careers@northgate.edu', subject: 'Co-op fair this Thursday, 10 AM to 2 PM',
        lines: ['More than 40 employers will be in the Student Union Building.', 'Bring a few printed resumes. No sign-up needed.'],
        cta: 'See employers', url: 'https://careers.northgate.edu/events',
        why: 'Real domain, real event details, and nothing asked of you.' },
    ];
    const o = pick(options);
    return {
      id: id(), phish: false, channel: 'email',
      fromName: o.brand.name,
      from: o.from ?? `${pick(['no-reply', 'notifications', 'hello'])}@${o.brand.domain}`,
      subject: o.subject, lines: o.lines, cta: o.cta, url: o.url, why: o.why,
    };
  }

  function realText(): Message {
    const options = [
      { text: `Halcyon Bank: Your verification code is ${int(100000, 999999)}. We will never ask you for this code.`, why: "A code you asked for, a warning not to share it, and no link." },
      { text: `ParcelDash: Your package was delivered to your front door at ${pick(['2:14', '11:48', '4:52'])} PM.`, why: 'Just info. No link, no fee, no ask.' },
      { text: 'Maple Mobile: You have used 80% of your data this month. Check your usage in the Maple Mobile app.', why: 'It sends you to the official app, not a link.' },
      { text: 'Northgate Alerts: Campus closes at 2 PM today because of the storm. Updates on northgate.edu.', why: 'Public info, and it just names the real website.' },
    ];
    const o = pick(options);
    return { id: id(), phish: false, channel: 'sms', from: pick(['72265', '46645', '28877']), lines: [o.text], why: o.why };
  }

  return function next(level: Level): Message {
    const phish = chance(level === 0 ? 0.6 : 0.55);
    if (!phish) return chance(0.3) ? realText() : realEmail(level);
    if (feedUrls.length && chance(0.15)) return feedMessage();
    if (chance(0.25)) return scamText();
    if (chance(0.3)) return personEmail();
    return brandEmail(level);
  };
}
