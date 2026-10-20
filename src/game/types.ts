// The 9 tricks scammers use. Every red flag in the game is tagged with one of these.
export type Trick =
  | 'Fake sender'
  | 'Lookalike link'
  | 'Urgency and threats'
  | 'Asks for money or gift cards'
  | 'Asks for passwords or bank info'
  | 'Too good to be true'
  | 'Bait file or curiosity'
  | 'Asks you to keep it secret'
  | 'Reply-To trick';

export type Channel = 'email' | 'sms';

export interface AttackTechnique {
  id: string; // MITRE ATT&CK id, e.g. T1566.002
  name: string;
}

export interface Message {
  id: string;
  phish: boolean;
  channel: Channel;
  fromName?: string; // emails only
  from: string; // email address or phone number, may contain flag markup
  replyTo?: string;
  subject?: string;
  lines: string[]; // body text, may contain flag markup
  cta?: string; // button text shown in the email
  url?: string; // where the button goes, may contain flag markup
  why?: string; // legit messages: why it's safe
  attack?: AttackTechnique; // phish messages: what MITRE ATT&CK calls it
  fromFeed?: boolean; // true when the link is a real one from OpenPhish
}

export type Level = 0 | 1 | 2;
