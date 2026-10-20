import type { AttackTechnique } from './types';

// MITRE ATT&CK ids for the kinds of scams in the game.
// Full list: https://attack.mitre.org/techniques/T1566/
export const ATTACK = {
  link: { id: 'T1566.002', name: 'Phishing: Spearphishing Link' },
  credsLink: { id: 'T1598.003', name: 'Phishing for Information: Spearphishing Link' },
  infoByEmail: { id: 'T1598', name: 'Phishing for Information' },
  impersonation: { id: 'T1656', name: 'Impersonation' },
  maliciousLink: { id: 'T1204.001', name: 'User Execution: Malicious Link' },
  mobile: { id: 'T1660', name: 'Phishing (Mobile)' },
} satisfies Record<string, AttackTechnique>;

export const attackUrl = (id: string) =>
  `https://attack.mitre.org/techniques/${id.replace('.', '/')}/`;
