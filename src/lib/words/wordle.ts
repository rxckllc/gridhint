export type Pattern = [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2];

/**
 * Marks exact matches green (2) first.
 * Then marks yellows (1) if an unconsumed copy remains.
 * Otherwise gray (0).
 */
export function scoreGuess(guess: string, answer: string): Pattern {
  const out: number[] = [0, 0, 0, 0, 0];
  const remaining = new Map<string, number>();

  // Pass 1: Green matches
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) {
      out[i] = 2;
    } else {
      remaining.set(answer[i], (remaining.get(answer[i]) ?? 0) + 1);
    }
  }

  // Pass 2: Yellow matches
  for (let i = 0; i < 5; i++) {
    if (out[i] === 2) continue;
    const count = remaining.get(guess[i]) ?? 0;
    if (count > 0) {
      out[i] = 1;
      remaining.set(guess[i], count - 1);
    }
  }

  return out as Pattern;
}

export function encodePattern(pattern: Pattern): number {
  return pattern.reduce((acc: number, value) => acc * 3 + value, 0);
}

export function samePattern(a: Pattern, b: Pattern): boolean {
  return a.every((value, index) => value === b[index]);
}

export function filterAnswers(
  answers: string[],
  constraints: Array<{ guess: string; pattern: Pattern }>
): string[] {
  if (constraints.length === 0) return answers;
  return answers.filter(answer =>
    constraints.every(row => samePattern(scoreGuess(row.guess.toLowerCase(), answer.toLowerCase()), row.pattern))
  );
}
