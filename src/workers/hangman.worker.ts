/// <reference lib="webworker" />
import { solveHangman } from '@/lib/words/hangman';

self.onmessage = (event) => {
  const { type, payload } = event.data;
  if (type === 'solve') {
    self.postMessage({
      type: 'result',
      payload: solveHangman(payload)
    });
  }
};
