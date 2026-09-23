// Keep descriptions as text; only validated HTTP(S) addresses become links.
export function descriptionLinks(text) {
  const parts = [];
  const urls = /(?:https?:\/\/|\bwww\.)(?:(?!https?:\/\/)[^\s<>"'])+/gi;
  let cursor = 0;
  for (const match of text.matchAll(urls)) {
    let label = match[0].replace(/[.,!?;:]+$/, '');
    for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
      while (label.endsWith(close) && label.split(close).length > label.split(open).length) {
        label = label.slice(0, -1);
      }
    }
    try {
      const url = new URL(/^www\./i.test(label) ? `https://${label}` : label);
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) continue;
      parts.push({ text: text.slice(cursor, match.index) }, { text: label, href: url.href });
      cursor = match.index + label.length;
    } catch {
      // Malformed addresses remain plain text.
    }
  }
  parts.push({ text: text.slice(cursor) });
  return parts;
}
