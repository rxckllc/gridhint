import allWordsRaw from '@/data/words/all-words.json';

interface WordRecord {
  word: string;
  len: number;
  sig: string;
  mask: number;
  counts: Record<string, number>;
  freqZipf: number;
}

export function getDictionary(): string[] {
  return (allWordsRaw as WordRecord[]).map((r) => r.word);
}

export function unscrambleWords(letters: string): Record<number, string[]> {
  const dictionary = getDictionary();
  const targetLetters = letters.toLowerCase().split('').sort().join('');
  const results: Record<number, string[]> = {};

  dictionary.forEach(word => {
    const wordLetters = word.toLowerCase().split('').sort().join('');
    if (isSubset(wordLetters, targetLetters)) {
      const len = word.length;
      if (!results[len]) results[len] = [];
      results[len].push(word);
    }
  });

  return results;
}

function isSubset(subset: string, superset: string): boolean {
  const superArr = superset.split('');
  for (const char of subset) {
    const idx = superArr.indexOf(char);
    if (idx === -1) return false;
    superArr.splice(idx, 1);
  }
  return true;
}
