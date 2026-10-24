import { ReaderSettings, ReadingProgress } from '@/types';

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'sepia', // Vàng giấy bảo vệ mắt
  fontSize: 20,
  lineHeight: 1.8,
  fontFamily: 'be-vietnam',
  maxWidth: 'normal'
};

const SETTINGS_KEY = 'bientruyen_reader_settings';
const PROGRESS_KEY = 'bientruyen_reading_progress';
const WALLET_KEY = 'bientruyen_user_wallet';
const UNLOCKED_KEY = 'bientruyen_unlocked_chapters';

export function getStoredSettings(): ReaderSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: ReaderSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function getReadingProgress(): ReadingProgress[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveReadingProgress(progress: ReadingProgress) {
  if (typeof window === 'undefined') return;
  try {
    const list = getReadingProgress();
    const filtered = list.filter(p => p.storySlug !== progress.storySlug);
    const updated = [progress, ...filtered].slice(0, 15);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
    localStorage.setItem(`bientruyen_last_read_${progress.storySlug}`, progress.chapterNumber.toString());
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

export function saveLastReadChapter(slug: string, chapterNum: number) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`bientruyen_last_read_${slug}`, chapterNum.toString());
  } catch (e) {}
}

export function getLastReadChapter(slug: string): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const direct = localStorage.getItem(`bientruyen_last_read_${slug}`);
    if (direct) {
      const n = parseInt(direct, 10);
      if (!isNaN(n) && n > 0) return n;
    }
    const list = getReadingProgress();
    const item = list.find((p) => p.storySlug === slug);
    if (item && item.chapterNumber > 0) return item.chapterNumber;
  } catch (e) {}
  return null;
}

export function getUserCoins(): number {
  if (typeof window === 'undefined') return 50; // Tặng sẵn 50 Xu ban đầu để test nạp/mở khóa
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (raw === null) {
      localStorage.setItem(WALLET_KEY, '50');
      return 50;
    }
    return parseInt(raw, 10) || 0;
  } catch {
    return 50;
  }
}

export function setUserCoins(coins: number) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WALLET_KEY, coins.toString());
  } catch (e) {
    console.error('Failed to set coins:', e);
  }
}

export function getUnlockedChapters(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(UNLOCKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function unlockChapterId(chapterId: string) {
  if (typeof window === 'undefined') return;
  try {
    const list = getUnlockedChapters();
    if (!list.includes(chapterId)) {
      list.push(chapterId);
      localStorage.setItem(UNLOCKED_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Failed to unlock chapter:', e);
  }
}
