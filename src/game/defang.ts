// Real phishing links are never shown as something you can click.
// "Defanging" is what security people do: https://bad.com -> hxxps://bad[.]com
export function defang(url: string): string {
  const clean = url.trim().replace(/^http/i, 'hxxp');
  const m = clean.match(/^(hxxps?:\/\/)([^/]+)(.*)$/i);
  if (!m) return clean.replace(/\./g, '[.]');
  const path = m[3].length > 40 ? m[3].slice(0, 40) + '…' : m[3];
  return m[1] + m[2].replace(/\./g, '[.]') + path;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
