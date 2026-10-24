'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { INITIAL_STORIES } from '@/data/stories';
import { Story, ReadingProgress } from '@/types';
import { getReadingProgress, getLastReadChapter } from '@/lib/storage';
import {
  BookOpen,
  Star,
  Eye,
  Calendar,
  Lock,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Headphones,
  Check,
  Loader2,
  Search,
  ArrowUpDown
} from 'lucide-react';

import { getImportedStoryBySlug, ImportedStory } from '@/lib/importedBookStorage';

function StoryDetailContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [savedProgress, setSavedProgress] = useState<ReadingProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [importedStory, setImportedStory] = useState<ImportedStory | null>(null);
  const [apiStory, setApiStory] = useState<any>(null);
  const [isLoadingStory, setIsLoadingStory] = useState(true);
  const [highlightedChapter, setHighlightedChapter] = useState<number | null>(null);
  const [chapterFilter, setChapterFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const initialStory = INITIAL_STORIES.find((s) => s.slug === slug);

  useEffect(() => {
    if (!slug) return;

    const list = getReadingProgress();
    const current = list.find((p) => p.storySlug === slug);
    if (current) setSavedProgress(current);

    try {
      const key = `bientruyen_offline_story_${slug}`;
      if (localStorage.getItem(key)) {
        setIsDownloaded(true);
      }
    } catch (e) {}

    async function loadStory() {
      setIsLoadingStory(true);

      // Nếu không có trong INITIAL_STORIES, ưu tiên nạp ngay từ IndexedDB (Sách tự nhập / EPUB / TXT)
      if (!initialStory) {
        try {
          const custom = await getImportedStoryBySlug(slug);
          if (custom) {
            setImportedStory(custom);
            setIsLoadingStory(false);
            return;
          }
        } catch (e) {
          console.warn('Lỗi nạp sách tự nhập:', e);
        }
      }

      // Nạp từ API v1 của máy chủ (đầy đủ danh sách chương từ stories_repo)
      try {
        const res = await fetch(`/api/v1/stories/${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.story) {
            setApiStory(data.story);
            setIsLoadingStory(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Error fetching story detail:', err);
      }

      setIsLoadingStory(false);
    }

    loadStory();
  }, [slug, initialStory]);

  const story: any = apiStory || initialStory || importedStory;

  // Tải ngoại tuyến tất cả các chương mẫu (Offline 1-Click như LaziBook)
  const handleDownloadOffline = async () => {
    if (!story) return;
    setIsDownloading(true);
    setDownloadProgress(0);

    const chapters = story.chapters || [];
    const total = chapters.length;

    try {
      for (let i = 0; i < total; i++) {
        const chap = chapters[i];
        const offlineKey = `bientruyen_offline_${story.slug}_chap_${chap.number}`;
        const payload = {
          title: chap.title,
          content: chap.content || '',
          savedAt: Date.now(),
        };
        localStorage.setItem(offlineKey, JSON.stringify(payload));
        setDownloadProgress(Math.round(((i + 1) / total) * 100));
        await new Promise((r) => setTimeout(r, 60));
      }

      localStorage.setItem(`bientruyen_offline_story_${slug}`, 'true');
      setIsDownloaded(true);
    } catch (e) {
      console.warn('Lỗi tải ngoại tuyến:', e);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  const chapters = story?.chapters || [];
  const latestChapter = chapters.length > 0 ? chapters[chapters.length - 1] : undefined;

  // Tự động khôi phục vị trí chương khi người dùng Back lại từ trang đọc chương
  useEffect(() => {
    if (isLoadingStory || !story || chapters.length === 0) return;

    let targetNum: number | null = null;
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const match = hash.match(/#chap(?:ter)?-(\d+)/i);
      if (match && match[1]) {
        targetNum = parseInt(match[1], 10);
      }
      if (!targetNum) {
        const stored = sessionStorage.getItem(`bientruyen_last_chap_${slug}`);
        if (stored) {
          targetNum = parseInt(stored, 10);
        }
      }
    }

    if (!targetNum && savedProgress?.chapterNumber) {
      targetNum = savedProgress.chapterNumber;
    }

    if (targetNum && !isNaN(targetNum)) {
      setHighlightedChapter(targetNum);
      const timer = setTimeout(() => {
        const el = document.getElementById(`chapter-item-${targetNum}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoadingStory, story, slug, chapters.length, savedProgress]);

  const displayChapters = useMemo(() => {
    let list = [...chapters];
    if (sortOrder === 'desc') {
      list.reverse();
    }
    if (chapterFilter.trim()) {
      const q = chapterFilter.toLowerCase().trim();
      list = list.filter((c: any) =>
        (c.title && c.title.toLowerCase().includes(q)) ||
        String(c.number).includes(q)
      );
    }
    return list;
  }, [chapters, sortOrder, chapterFilter]);

  if (isLoadingStory) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
          Đang nạp dữ liệu truyện...
        </p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
          Không tìm thấy truyện yêu cầu
        </h2>
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6">
      {/* Nút quay lại & Điều hướng nhanh */}
      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/');
            }
          }}
          className="inline-flex items-center space-x-1.5 font-bold text-neutral-600 dark:text-neutral-300 hover:text-amber-500 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-amber-500" />
          <span>Quay lại</span>
        </button>
        <span className="text-neutral-300 dark:text-neutral-700">|</span>
        <Link
          href="/"
          className="font-medium text-neutral-500 hover:text-amber-500 transition"
        >
          Trang chủ
        </Link>
        <span className="text-neutral-300 dark:text-neutral-700">/</span>
        <Link
          href="/ke-sach"
          className="font-medium text-neutral-500 hover:text-amber-500 transition"
        >
          Kệ sách
        </Link>
      </div>

      {/* Thông tin truyện */}
      <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Bìa truyện */}
          <div className="flex justify-center md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={story.coverUrl}
              alt={story.title}
              className="w-56 md:w-full h-80 object-cover rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-800"
            />
          </div>

          {/* Chi tiết */}
          <div className="md:col-span-3 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {(story.categories || []).map((c: any, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  >
                    {c}
                  </span>
                ))}
                <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Headphones className="w-3 h-3" />
                  Đồng bộ Chữ & Tiếng
                </span>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  Đọc ngoại tuyến
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                {story.title}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                <span>Tác giả: <strong className="text-neutral-800 dark:text-neutral-200">{story.author}</strong></span>
                <span className="flex items-center gap-1.5">
                  Tình trạng:
                  {story.status === 'Hoàn thành' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Hoàn thành (Full)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 font-bold text-xs border border-orange-300 dark:border-orange-800">
                      <Clock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                      Đang ra (Dở dang)
                    </span>
                  )}
                </span>
                <span className="flex items-center text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-500 mr-1" />
                  {story.rating} ({story.ratingCount})
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {(story.views / 1000).toFixed(0)}k lượt xem
                </span>
              </div>

              {/* Tóm tắt */}
              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Giới thiệu tác phẩm:
                </h3>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                  {story.description}
                </p>
              </div>
            </div>

            {/* Nút hành động đọc & Tải về offline */}
            <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center gap-3">
              {savedProgress ? (
                <Link
                  href={`/truyen/${story.slug}/chuong/${savedProgress.chapterNumber}`}
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20 transition flex items-center space-x-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Đọc tiếp: Chương {savedProgress.chapterNumber}</span>
                </Link>
              ) : null}

              <Link
                href={`/truyen/${story.slug}/chuong/1`}
                className={`px-5 py-3 rounded-xl font-bold text-sm transition flex items-center space-x-2 ${
                  savedProgress
                    ? 'border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Đọc từ đầu (Chương 1)</span>
              </Link>

              {latestChapter && latestChapter.number > 1 && (
                <Link
                  href={`/truyen/${story.slug}/chuong/${latestChapter.number}`}
                  className="px-5 py-3 rounded-xl font-bold text-sm border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  Chương mới nhất ({latestChapter.number})
                </Link>
              )}

              {/* Nút Tải Ngoại Tuyến (Offline Download - LaziBook Style) */}
              <button
                onClick={handleDownloadOffline}
                disabled={isDownloading || isDownloaded}
                className={`px-4 py-3 rounded-xl font-bold text-sm border transition flex items-center space-x-1.5 ${
                  isDownloaded
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : isDownloading
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    <span>Đang tải {downloadProgress}%...</span>
                  </>
                ) : isDownloaded ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Đã tải trọn bộ offline</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Tải về đọc ngoại tuyến</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Danh sách mục lục chương */}
      <section id="chapter-list-section" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-5 bg-amber-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Mục Lục Chương ({chapters.length})
            </h2>
          </div>

          {/* Cụm tìm kiếm và sắp xếp */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={chapterFilter}
                onChange={(e) => setChapterFilter(e.target.value)}
                placeholder="Tìm số hoặc tên chương..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500 w-44 sm:w-56 text-neutral-800 dark:text-neutral-200"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
            </div>

            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 px-2.5 text-xs font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition flex items-center gap-1 text-neutral-700 dark:text-neutral-300 cursor-pointer"
              title="Đảo thứ tự chương"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'asc' ? 'Cũ nhất' : 'Mới nhất'}</span>
            </button>
          </div>
        </div>

        {/* Thanh chuyển nhanh các mốc chương (nếu > 50 chương) */}
        {chapters.length > 50 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
            <span className="text-[11px] font-bold text-neutral-400 shrink-0">Nhảy nhanh:</span>
            {Array.from({ length: Math.ceil(chapters.length / 50) }, (_, i) => {
              const start = i * 50 + 1;
              const end = Math.min((i + 1) * 50, chapters.length);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    const targetEl = document.getElementById(`chapter-item-${start}`);
                    if (targetEl) {
                      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      setHighlightedChapter(start);
                    }
                  }}
                  className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-500 hover:text-white text-neutral-600 dark:text-neutral-300 font-semibold transition shrink-0 cursor-pointer"
                >
                  {start}-{end}
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayChapters.map((chap: any) => {
            const isHighlighted = chap.number === highlightedChapter;
            return (
              <Link
                key={chap.id}
                id={`chapter-item-${chap.number}`}
                href={`/truyen/${story.slug}/chuong/${chap.number}`}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem(`bientruyen_last_chap_${story.slug}`, String(chap.number));
                  }
                }}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition group relative ${
                  isHighlighted
                    ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/50 shadow-md'
                    : 'border-neutral-100 dark:border-neutral-800/80 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/30 dark:hover:bg-amber-950/10'
                }`}
              >
                <div className="truncate mr-3">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`font-semibold text-sm transition truncate block ${
                      isHighlighted
                        ? 'text-amber-600 dark:text-amber-400 font-bold'
                        : 'text-neutral-800 dark:text-neutral-200 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                    }`}>
                      {chap.title}
                    </span>
                    {isHighlighted && (
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                        Vừa xem
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    {chap.wordCount ? `${chap.wordCount} chữ • ` : ''}{chap.publishedAt || ''}
                  </span>
                </div>

                {chap.isVip ? (
                  <span className="shrink-0 inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
                    <Lock className="w-3 h-3" />
                    <span>VIP ({chap.coinPrice || 10} Xu)</span>
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
                    Miễn phí
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function StoryDetailPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-neutral-400">Đang tải truyện...</div>}>
      <StoryDetailContent />
    </Suspense>
  );
}
