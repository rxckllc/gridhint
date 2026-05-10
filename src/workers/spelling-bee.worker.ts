/// <reference lib="webworker" />
import { solveSpellingBee } from '@/lib/words/spelling-bee';

self.onmessage = (event) => {
  const { type, payload } = event.data;
  if (type === 'solve') {
    const result = solveSpellingBee(payload);
    self.postMessage({
      type: 'result',
      payload: result
    });
  }
};
