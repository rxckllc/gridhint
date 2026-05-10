/// <reference lib="webworker" />

import { filterAnswers, type Pattern } from '@/lib/words/wordle';
import { rankGuesses } from '@/lib/words/wordleEntropy';

let answers: string[] = [];
let guesses: string[] = [];
let freq: Record<string, number> = {};

type InitMessage = {
  type: 'init';
  payload: {
    answers: string[];
    guesses: string[];
    freq: Record<string, number>;
  };
};

type SolveMessage = {
  type: 'solve';
  payload: {
    rows: Array<{ guess: string; pattern: Pattern }>;
    topN?: number;
  };
};

self.onmessage = (event: MessageEvent<InitMessage | SolveMessage>) => {
  const { type, payload } = event.data;

  if (type === 'init') {
    answers = payload.answers;
    guesses = payload.guesses;
    freq = payload.freq;
    self.postMessage({ type: 'ready' });
    return;
  }

  if (type === 'solve') {
    if (answers.length === 0) {
       self.postMessage({ type: 'error', payload: 'Worker not initialized' });
       return;
    }
    const remaining = filterAnswers(answers, payload.rows);
    const ranked = rankGuesses(guesses, remaining, freq, payload.topN ?? 25);
    self.postMessage({
      type: 'result',
      payload: {
        remainingCount: remaining.length,
        remainingAnswers: remaining.slice(0, 100),
        ranked
      }
    });
  }
};
