/**
 * Helper to generate wildcard patterns for a word.
 * cat -> [*at, c*t, ca*]
 */
export function wildcardPatterns(word: string) {
  const out: string[] = [];
  for (let i = 0; i < word.length; i++) {
    out.push(word.slice(0, i) + '*' + word.slice(i + 1));
  }
  return out;
}

/**
 * Gets all neighbors of a word (words differing by one letter) using the wildcard index.
 */
export function getNeighbors(
  word: string,
  wildcardIndex: Record<string, string[]>
) {
  const neighbors = new Set<string>();

  for (const pattern of wildcardPatterns(word)) {
    for (const candidate of wildcardIndex[pattern] ?? []) {
      if (candidate !== word) neighbors.add(candidate);
    }
  }

  return Array.from(neighbors);
}

/**
 * Bi-directional Breadth-First Search for the shortest word ladder.
 * Significantly more efficient than unidirectional BFS for deep graphs.
 */
export function bfsShortestPath(input: {
  start: string;
  end: string;
  wildcardIndex: Record<string, string[]>;
  wordSet: Set<string>;
  maxVisited?: number;
}) {
  const start = input.start.toLowerCase();
  const end = input.end.toLowerCase();
  const maxVisited = input.maxVisited ?? 50000;

  if (start.length !== end.length) {
    return { found: false, path: [], steps: 0, visitedCount: 0, warnings: ['Start and end words must be the same length.'] };
  }

  if (!input.wordSet.has(start) || !input.wordSet.has(end)) {
    const warnings = [];
    if (!input.wordSet.has(start)) warnings.push(`Start word "${start}" not in dictionary.`);
    if (!input.wordSet.has(end)) warnings.push(`End word "${end}" not in dictionary.`);
    return { found: false, path: [], steps: 0, visitedCount: 0, warnings };
  }

  if (start === end) {
    return { found: true, path: [start], steps: 0, visitedCount: 1, warnings: [] };
  }

  // Forward search state
  const fwdVisited = new Map<string, string | null>([[start, null]]);
  let fwdFrontier = new Set<string>([start]);

  // Backward search state
  const bwdVisited = new Map<string, string | null>([[end, null]]);
  let bwdFrontier = new Set<string>([end]);

  let visitedCount = 2;

  while (fwdFrontier.size > 0 && bwdFrontier.size > 0) {
    // Always expand the smaller frontier to keep the search balanced
    const isFwd = fwdFrontier.size <= bwdFrontier.size;
    const currentFrontier = isFwd ? fwdFrontier : bwdFrontier;
    const currentVisited = isFwd ? fwdVisited : bwdVisited;
    const otherVisited = isFwd ? bwdVisited : fwdVisited;
    
    const nextFrontier = new Set<string>();

    for (const node of currentFrontier) {
      for (const neighbor of getNeighbors(node, input.wildcardIndex)) {
        if (currentVisited.has(neighbor)) continue;

        currentVisited.set(neighbor, node);
        visitedCount++;

        if (otherVisited.has(neighbor)) {
          // Path found!
          const path = constructPath(neighbor, fwdVisited, bwdVisited, isFwd);
          return {
            found: true,
            path,
            steps: path.length - 1,
            visitedCount,
            warnings: []
          };
        }

        if (visitedCount >= maxVisited) {
          return { found: false, path: [], steps: 0, visitedCount, warnings: ['Search limit reached.'] };
        }

        nextFrontier.add(neighbor);
      }
    }

    if (isFwd) fwdFrontier = nextFrontier;
    else bwdFrontier = nextFrontier;
  }

  return { found: false, path: [], steps: 0, visitedCount, warnings: ['No path found.'] };
}

function constructPath(meet: string, fwd: Map<string, string | null>, bwd: Map<string, string | null>, isFwdStep: boolean): string[] {
  const pathFwd: string[] = [];
  let curr: string | null = meet;
  while (curr !== null) {
    pathFwd.unshift(curr);
    curr = fwd.get(curr) || null;
  }
  
  const pathBwd: string[] = [];
  curr = bwd.get(meet) ?? null;
  while (curr !== null) {
    pathBwd.push(curr);
    curr = bwd.get(curr) ?? null;
  }

  // pathFwd: start -> meet (inclusive)
  // pathBwd: node after meet toward end (inclusive of end)
  // Together they form the full path without duplication.

  return [...pathFwd, ...pathBwd];
}
