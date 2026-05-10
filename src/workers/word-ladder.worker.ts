/// <reference lib="webworker" />
import { bfsShortestPath } from '@/lib/words/word-ladder';

// Statically import all 5 length variants so Next/Turbopack can bundle them.
import wildcards3 from '@/data/indexes/word-ladder/wildcards-len-3.json';
import wildcards4 from '@/data/indexes/word-ladder/wildcards-len-4.json';
import wildcards5 from '@/data/indexes/word-ladder/wildcards-len-5.json';
import wildcards6 from '@/data/indexes/word-ladder/wildcards-len-6.json';
import wildcards7 from '@/data/indexes/word-ladder/wildcards-len-7.json';

import words3 from '@/data/words/ladder-words-len-3.json';
import words4 from '@/data/words/ladder-words-len-4.json';
import words5 from '@/data/words/ladder-words-len-5.json';
import words6 from '@/data/words/ladder-words-len-6.json';
import words7 from '@/data/words/ladder-words-len-7.json';

type WildcardIndex = Record<string, string[]>;

const indexByLen: Record<number, WildcardIndex> = {
  3: wildcards3 as WildcardIndex,
  4: wildcards4 as WildcardIndex,
  5: wildcards5 as WildcardIndex,
  6: wildcards6 as WildcardIndex,
  7: wildcards7 as WildcardIndex,
};

const wordsByLen: Record<number, string[]> = {
  3: words3 as string[],
  4: words4 as string[],
  5: words5 as string[],
  6: words6 as string[],
  7: words7 as string[],
};

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === 'solve') {
    try {
      const len = payload.start.length;

      const wildcardIndex = indexByLen[len];
      const words = wordsByLen[len];

      if (!wildcardIndex || !words) {
        self.postMessage({
          type: 'result',
          payload: {
            found: false,
            path: [],
            steps: 0,
            visitedCount: 0,
            warnings: [`Word length ${len} is not supported (supported: 3-7).`],
          },
        });
        return;
      }

      const result = bfsShortestPath({
        start: payload.start,
        end: payload.end,
        wildcardIndex,
        wordSet: new Set(words),
        maxVisited: payload.maxVisited,
      });

      self.postMessage({ type: 'result', payload: result });
    } catch (e) {
      self.postMessage({ type: 'error', payload: String(e) });
    }
  }
};
