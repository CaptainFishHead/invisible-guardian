import type { Chapter } from '@/core/types/story';
import { chapter1 } from './chapter1';
import { chapter2 } from './chapter2';

const chapterMap: Record<string, Chapter> = {
  [chapter1.id]: chapter1,
  [chapter2.id]: chapter2
};

export function getChapterById(chapterId: string): Chapter | null {
  return chapterMap[chapterId] ?? null;
}

export function getAllChapters(): Chapter[] {
  return Object.values(chapterMap);
}
