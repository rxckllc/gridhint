/// <reference lib="webworker" />
import { unscramble } from '@/lib/words/unscramble';
import { scrambleMany } from '@/lib/words/scramble';

self.onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === 'unscramble') {
    const result = unscramble(payload.letters, payload.options);
    self.postMessage({
      type: 'unscramble:result',
      payload: result
    });
  }

  if (type === 'scramble') {
    const result = scrambleMany(payload.word, payload.count, payload.derangement);
    self.postMessage({
      type: 'scramble:result',
      payload: result
    });
  }
};
