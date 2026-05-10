export function normalizeLetters(input: string): string {
  return input.toLowerCase().replace(/[^a-z]/g, '');
}

export function signature(input: string): string {
  return [...normalizeLetters(input)].sort().join('');
}

export function letterCounts(input: string): Uint8Array {
  const out = new Uint8Array(26);
  for (const ch of normalizeLetters(input)) {
    out[ch.charCodeAt(0) - 97]++;
  }
  return out;
}

export function letterMask(input: string): number {
  let m = 0;
  for (const ch of normalizeLetters(input)) {
    const code = ch.charCodeAt(0) - 97;
    if (code >= 0 && code < 26) {
      m |= 1 << code;
    }
  }
  return m;
}

export function multisetSubset(wordCounts: number[] | Uint8Array, queryCounts: number[] | Uint8Array) {
  for (let i = 0; i < 26; i++) {
    if ((wordCounts[i] || 0) > (queryCounts[i] || 0)) return false;
  }
  return true;
}

/**
 * Returns true if every letter in wordSig appears in querySig with at least the same count.
 * Both inputs must be sorted ascending (a-z), as produced by signature().
 * O(|wordSig| + |querySig|), no allocations.
 */
export function sigSubset(wordSig: string, querySig: string): boolean {
  if (wordSig.length > querySig.length) return false;
  let i = 0;
  let j = 0;
  while (i < wordSig.length) {
    if (j >= querySig.length) return false;
    const wc = wordSig.charCodeAt(i);
    const qc = querySig.charCodeAt(j);
    if (wc === qc) {
      i++;
      j++;
    } else if (wc > qc) {
      j++;
    } else {
      // wordSig has a letter that's earlier than the current query letter — missing.
      return false;
    }
  }
  return true;
}
