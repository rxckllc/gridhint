// Import and re-export the canonical schema-derived types so all consumers can
// import from '@/lib/puzzles/connections' and get the strict Zod-validated shapes.
import type { ConnectionsPuzzle, ConnectionsGroup, ConnectionsManifest, Difficulty } from './connections-schema';
export type { ConnectionsPuzzle, ConnectionsGroup, ConnectionsManifest, Difficulty };

export type RevealLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Strictly typed revealed group state based on the current reveal level.
 * This prevents accidental access to data (like category or words) before they are revealed.
 */
export type RevealedGroupState = 
  | { level: 0; difficulty: Difficulty }
  | { level: 1; difficulty: Difficulty; hint1: string }
  | { level: 2; difficulty: Difficulty; hint1: string; hint2: string }
  | { level: 3; difficulty: Difficulty; hint1: string; hint2: string; hint3: string; category: string }
  | { level: 4; difficulty: Difficulty; hint1: string; hint2: string; hint3: string; category: string; words: [string, string, string, string] };

export function revealGroup(group: ConnectionsGroup, level: RevealLevel): RevealedGroupState {
  switch (level) {
    case 1:
      return { level: 1, difficulty: group.difficulty, hint1: group.hint1 };
    case 2:
      return { level: 2, difficulty: group.difficulty, hint1: group.hint1, hint2: group.hint2 };
    case 3:
      return { level: 3, difficulty: group.difficulty, hint1: group.hint1, hint2: group.hint2, hint3: group.hint3, category: group.category };
    case 4:
      return { level: 4, difficulty: group.difficulty, hint1: group.hint1, hint2: group.hint2, hint3: group.hint3, category: group.category, words: group.words };
    default:
      return { level: 0, difficulty: group.difficulty };
  }
}

/**
 * Deterministically shuffles the grid based on the puzzle date to ensure 
 * the game is not spoiled by the layout order while remaining stable for all users.
 */
export function shuffleGrid(grid: string[], seed: string): string[] {
  const shuffled = [...grid];
  // Simple seed-based shuffle
  let seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    seedNum = (seedNum * 9301 + 49297) % 233280;
    const j = Math.floor((seedNum / 233280) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
