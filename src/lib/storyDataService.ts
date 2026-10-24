import fs from 'fs';
import path from 'path';
import { StorySummary, ChapterSummary } from '@/types';
import { getChapter as fetchChapterFromProvider } from './novelChapterProvider';

const DATA_DIR = path.join(process.cwd(), 'src/data');
const STORIES_SUMMARY_FILE = path.join(DATA_DIR, 'stories_summary.json');
const STORIES_METADATA_FILE = path.join(DATA_DIR, 'stories_metadata.json');
const REPO_DIR = path.join(DATA_DIR, 'stories_repo');

let cachedSummaries: StorySummary[] | null = null;
let cachedMetadataMap: Map<string, { summary: StorySummary; chapters: ChapterSummary[] }> | null = null;

export function loadStorySummaries(): StorySummary[] {
  if (cachedSummaries) return cachedSummaries;

  if (fs.existsSync(STORIES_SUMMARY_FILE)) {
    try {
      const raw = fs.readFileSync(STORIES_SUMMARY_FILE, 'utf8');
      cachedSummaries = JSON.parse(raw);
      return cachedSummaries!;
    } catch (e) {
      console.error('[StoryDataService] Error reading stories_summary.json:', e);
    }
  }

  // Fallback to stories_metadata.json
  if (fs.existsSync(STORIES_METADATA_FILE)) {
    try {
      const raw = fs.readFileSync(STORIES_METADATA_FILE, 'utf8');
      const list = JSON.parse(raw);
      cachedSummaries = list.map((s: any) => {
        const { chapters, ...meta } = s;
        return meta;
      });
      return cachedSummaries!;
    } catch (e) {
      console.error('[StoryDataService] Fallback reading stories_metadata.json error:', e);
    }
  }

  return [];
}

export function loadStoryDetail(slug: string): { summary: StorySummary; chapters: ChapterSummary[] } | null {
  // 1. Ưu tiên kiểm tra file stories_repo/${slug}.json (dữ liệu thật, chất lượng cao, có đầy đủ nội dung)
  const repoFile = path.join(REPO_DIR, `${slug}.json`);
  if (fs.existsSync(repoFile)) {
    try {
      const repoData = JSON.parse(fs.readFileSync(repoFile, 'utf8'));
      const chapters: ChapterSummary[] = (repoData.chapters || []).map((c: any) => ({
        id: c.id || `chap-${c.number}`,
        number: c.number,
        title: c.title || `Chương ${c.number}`,
        wordCount: c.wordCount || 1500,
        publishedAt: c.publishedAt || repoData.updatedAt || '2026-10-18',
        isVip: !!c.isVip,
        coinPrice: c.coinPrice || 0
      }));

      const summary: StorySummary = {
        id: repoData.id || slug,
        slug: repoData.slug || slug,
        title: repoData.title || slug,
        author: repoData.author || 'Tác giả ẩn danh',
        coverUrl: repoData.coverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
        bannerUrl: repoData.bannerUrl,
        description: repoData.description || '',
        categories: repoData.categories || [],
        status: repoData.status || 'Đang ra',
        views: repoData.views || 0,
        rating: repoData.rating || 4.8,
        ratingCount: repoData.ratingCount || 100,
        chaptersCount: Math.max(repoData.chaptersCount || 0, chapters.length),
        updatedAt: repoData.updatedAt || '2026-10-18'
      };

      return { summary, chapters };
    } catch (e) {
      console.error(`[StoryDataService] Error reading repo file for ${slug}:`, e);
    }
  }

  // 2. Kiểm tra cache từ stories_metadata.json
  if (!cachedMetadataMap) {
    cachedMetadataMap = new Map();
    if (fs.existsSync(STORIES_METADATA_FILE)) {
      try {
        const raw = fs.readFileSync(STORIES_METADATA_FILE, 'utf8');
        const list = JSON.parse(raw);
        for (const item of list) {
          cachedMetadataMap.set(item.slug, {
            summary: {
              id: item.id,
              slug: item.slug,
              title: item.title,
              author: item.author,
              coverUrl: item.coverUrl,
              bannerUrl: item.bannerUrl,
              description: item.description,
              categories: item.categories || [],
              status: item.status || 'Hoàn thành',
              views: item.views || 0,
              rating: item.rating || 4.8,
              ratingCount: item.ratingCount || 100,
              chaptersCount: item.chaptersCount || (item.chapters ? item.chapters.length : 0),
              updatedAt: item.updatedAt || '2026-10-14'
            },
            chapters: item.chapters || []
          });
        }
      } catch (e) {
        console.error('[StoryDataService] Error parsing metadata map:', e);
      }
    }
  }

  const found = cachedMetadataMap.get(slug);
  if (found) return found;

  return null;
}

export async function getChapterDetail(slug: string, chapterNum: number) {
  return await fetchChapterFromProvider(slug, chapterNum);
}
