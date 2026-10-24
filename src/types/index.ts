export interface ChapterSummary {
  id: string;
  number: number;
  title: string;
  wordCount?: number;
  publishedAt?: string;
  isVip?: boolean;
  coinPrice?: number;
}

export interface Chapter extends ChapterSummary {
  content?: string;
}

export interface StorySummary {
  id: string;
  slug: string;
  title: string;
  author: string;
  coverUrl: string;
  bannerUrl?: string;
  description: string;
  categories: string[];
  status: 'Đang ra' | 'Hoàn thành';
  views: number;
  rating: number;
  ratingCount: number;
  chaptersCount: number;
  updatedAt: string;
}

export interface Story extends StorySummary {
  chapters: Chapter[];
}

export type ReaderTheme = 'sepia' | 'light' | 'emerald' | 'gray' | 'dark' | 'oled';
export type ReaderFont = 'sans' | 'serif' | 'lora' | 'be-vietnam' | 'merriweather' | 'nunito';

export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: number; // in px: 12 - 64 (Kindle / Apple Books dynamic reflow scale)
  lineHeight: number; // 1.6, 1.8, 2.0
  fontFamily: ReaderFont;
  maxWidth: 'compact' | 'normal' | 'wide'; // 700px, 850px, 1000px
  readMode?: 'scroll' | 'page'; // Chế độ đọc: Cuộn dọc vs Lật trang như sách thật
  voice?: string; // Giọng đọc mặc định đã chọn từ Phòng thu
}

export interface ReadingProgress {
  storySlug: string;
  storyTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  timestamp: number;
}

export interface CoinPackage {
  id: string;
  coins: number;
  bonusCoins: number;
  priceVnd: number;
  popular?: boolean;
}
