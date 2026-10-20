// Every company and person here is made up. Real brands stay out of the game on purpose.
export interface Brand {
  name: string;
  short: string;
  domain: string;
}

export const BRANDS: Brand[] = [
  { name: 'Northgate University', short: 'Northgate', domain: 'northgate.edu' },
  { name: 'Halcyon Bank', short: 'Halcyon', domain: 'halcyonbank.ca' },
  { name: 'ParcelDash', short: 'ParcelDash', domain: 'parceldash.com' },
  { name: 'CloudBox', short: 'CloudBox', domain: 'cloudbox.com' },
  { name: 'StreamHub', short: 'StreamHub', domain: 'streamhub.tv' },
  { name: 'Maple Mobile', short: 'Maple Mobile', domain: 'maplemobile.ca' },
  { name: 'Payflo', short: 'Payflo', domain: 'payflo.com' },
  { name: 'Corvid Games', short: 'Corvid', domain: 'corvidgames.com' },
];

export const byName = (short: string) => BRANDS.find((b) => b.short === short)!;

export const FIRST = ['Sam', 'Jordan', 'Priya', 'Alex', 'Mei', 'Omar', 'Lucas', 'Ava', 'Noah', 'Fatima', 'Liam', 'Chloe', 'Ethan', 'Sara'];
export const LAST = ['Lee', 'Patel', 'Nguyen', 'Martin', 'Brooks', 'Haddad', 'Fraser', 'MacLeod', 'Kim', 'Rossi', 'Ahmed', 'Clarke'];

export const PLAYER_EMAIL = 'sam.lee@northgate.edu';
