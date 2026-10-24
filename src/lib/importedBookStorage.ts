'use client';

export interface ImportedChapter {
  id: string;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  url?: string; // Optional remote url for on-demand fetch
}

export interface ImportedStory {
  id: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  coverUrl?: string;
  categories: string[];
  sourceType: 'file_txt' | 'file_epub' | 'url_crawl' | 'maccanh';
  sourceUrl?: string;
  chaptersCount: number;
  chapters: ImportedChapter[];
  importedAt: number;
  lastReadChapter?: number;
}

export interface ImportedStorySummary {
  id: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  coverUrl?: string;
  categories: string[];
  sourceType: 'file_txt' | 'file_epub' | 'url_crawl' | 'maccanh';
  chaptersCount: number;
  importedAt: number;
  lastReadChapter?: number;
}

const DB_NAME = 'taao_reader_db';
const STORE_STORIES = 'imported_stories';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_STORIES)) {
        const store = db.createObjectStore(STORE_STORIES, { keyPath: 'slug' });
        store.createIndex('importedAt', 'importedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Lưu truyện đã import vào IndexedDB
export async function saveImportedStory(story: ImportedStory): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_STORIES, 'readwrite');
      const store = tx.objectStore(STORE_STORIES);
      const req = store.put(story);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[Storage] Fallback to localStorage:', err);
    try {
      const listKey = 'bientruyen_custom_stories_index';
      const existing = JSON.parse(localStorage.getItem(listKey) || '[]');
      const filtered = existing.filter((s: any) => s.slug !== story.slug);
      const summary: ImportedStorySummary = {
        id: story.id,
        slug: story.slug,
        title: story.title,
        author: story.author,
        description: story.description,
        coverUrl: story.coverUrl,
        categories: story.categories,
        sourceType: story.sourceType,
        chaptersCount: story.chaptersCount,
        importedAt: story.importedAt,
        lastReadChapter: story.lastReadChapter || 1,
      };
      localStorage.setItem(listKey, JSON.stringify([summary, ...filtered]));
      localStorage.setItem(`bientruyen_custom_story_${story.slug}`, JSON.stringify(story));
    } catch (e) {
      console.error('[Storage] LocalStorage error:', e);
    }
  }
}

// Lấy danh sách tóm tắt tất cả truyện đã import
export async function getAllImportedStories(): Promise<ImportedStorySummary[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_STORIES, 'readonly');
      const store = tx.objectStore(STORE_STORIES);
      const req = store.getAll();
      req.onsuccess = () => {
        const list: ImportedStory[] = req.result || [];
        const summaries: ImportedStorySummary[] = list.map((s) => ({
          id: s.id,
          slug: s.slug,
          title: s.title,
          author: s.author,
          description: s.description,
          coverUrl: s.coverUrl,
          categories: s.categories,
          sourceType: s.sourceType,
          chaptersCount: s.chaptersCount || (s.chapters ? s.chapters.length : 0),
          importedAt: s.importedAt,
          lastReadChapter: s.lastReadChapter || 1,
        }));
        // Sắp xếp mới nhất lên đầu
        summaries.sort((a, b) => b.importedAt - a.importedAt);
        resolve(summaries);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      const listKey = 'bientruyen_custom_stories_index';
      return JSON.parse(localStorage.getItem(listKey) || '[]');
    } catch {
      return [];
    }
  }
}

// Lấy chi tiết truyện theo slug
export async function getImportedStoryBySlug(slug: string): Promise<ImportedStory | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_STORIES, 'readonly');
      const store = tx.objectStore(STORE_STORIES);
      const req = store.get(slug);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      const raw = localStorage.getItem(`bientruyen_custom_story_${slug}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

// Lấy nội dung 1 chương cụ thể
export async function getImportedChapter(
  slug: string,
  chapterNum: number
): Promise<{ title: string; content: string; url?: string } | null> {
  const story = await getImportedStoryBySlug(slug);
  if (!story || !story.chapters) return null;

  const chap = story.chapters.find((c) => Number(c.number) === Number(chapterNum) || String(c.number) === String(chapterNum));
  if (!chap) return null;

  return {
    title: chap.title || `Chương ${chapterNum}`,
    content: chap.content || '',
    url: chap.url,
  };
}

// Cập nhật nội dung chương (cho truyện crawl on-demand)
export async function updateImportedChapterContent(
  slug: string,
  chapterNum: number,
  content: string
): Promise<void> {
  const story = await getImportedStoryBySlug(slug);
  if (!story) return;

  const chap = story.chapters.find((c) => Number(c.number) === Number(chapterNum) || String(c.number) === String(chapterNum));
  if (chap) {
    chap.content = content;
    chap.wordCount = content.split(/\s+/).length;
    await saveImportedStory(story);
  }
}

// Cập nhật thông tin chi tiết của truyện tự nhập (Sửa tên, tác giả, ảnh bìa, mô tả, thể loại)
export async function updateImportedStoryMetadata(
  slug: string,
  updates: {
    title?: string;
    author?: string;
    description?: string;
    coverUrl?: string;
    categories?: string[];
  }
): Promise<ImportedStory | null> {
  const story = await getImportedStoryBySlug(slug);
  if (!story) return null;

  if (updates.title !== undefined) story.title = updates.title.trim();
  if (updates.author !== undefined) story.author = updates.author.trim();
  if (updates.description !== undefined) story.description = updates.description.trim();
  if (updates.coverUrl !== undefined) story.coverUrl = updates.coverUrl.trim();
  if (updates.categories !== undefined) story.categories = updates.categories;

  await saveImportedStory(story);
  return story;
}

// Xóa một chương cụ thể khỏi truyện tự nhập
export async function deleteChapterFromImportedStory(
  slug: string,
  chapterNumber: number
): Promise<boolean> {
  const story = await getImportedStoryBySlug(slug);
  if (!story || !story.chapters) return false;

  story.chapters = story.chapters.filter(
    (c) => Number(c.number) !== Number(chapterNumber) && String(c.number) !== String(chapterNumber)
  );
  story.chaptersCount = story.chapters.length;

  await saveImportedStory(story);
  return true;
}

// Đổi tên tiêu đề của một chương trong truyện tự nhập
export async function updateChapterTitleInImportedStory(
  slug: string,
  chapterNumber: number,
  newTitle: string
): Promise<boolean> {
  const story = await getImportedStoryBySlug(slug);
  if (!story || !story.chapters) return false;

  const chap = story.chapters.find(
    (c) => Number(c.number) === Number(chapterNumber) || String(c.number) === String(chapterNumber)
  );
  if (!chap) return false;

  chap.title = newTitle.trim();
  await saveImportedStory(story);
  return true;
}

// Xóa truyện tự nhập khỏi kệ sách
export async function deleteImportedStory(slug: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_STORIES, 'readwrite');
      const store = tx.objectStore(STORE_STORIES);
      const req = store.delete(slug);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Lỗi xóa IndexedDB:', e);
  }

  try {
    const listKey = 'bientruyen_custom_stories_index';
    const existing = JSON.parse(localStorage.getItem(listKey) || '[]');
    const filtered = existing.filter((s: any) => s.slug !== slug);
    localStorage.setItem(listKey, JSON.stringify(filtered));
    localStorage.removeItem(`bientruyen_custom_story_${slug}`);
  } catch (e) {}
}
