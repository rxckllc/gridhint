/// <reference lib="webworker" />
import { solveCrossword } from '@/lib/words/crossword';

self.onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === 'solve') {
    try {
      const results = solveCrossword({
        pattern: payload.pattern,
        clue: payload.clue,
        length: payload.length,
      });
      self.postMessage({ type: 'result', payload: results });
    } catch (e) {
      self.postMessage({ type: 'error', payload: String(e) });
    }
  }
};
