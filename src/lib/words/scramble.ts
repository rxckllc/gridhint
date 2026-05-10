export function scrambleWord(word: string, options: { derangement?: boolean } = {}) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  const chars = clean.split('');

  if (chars.length <= 1) return clean;

  for (let attempt = 0; attempt < 100; attempt++) {
    const shuffled = [...chars];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const result = shuffled.join('');
    if (!options.derangement) return result;
    if (shuffled.every((ch, index) => ch !== chars[index])) return result;
  }

  return chars.reverse().join('');
}

export function scrambleMany(word: string, count = 10, derangement = false) {
  const out = new Set<string>();
  const maxAttempts = 500;
  let attempts = 0;
  
  while (out.size < count && attempts < maxAttempts) {
    out.add(scrambleWord(word, { derangement }));
    attempts++;
  }
  return Array.from(out);
}
