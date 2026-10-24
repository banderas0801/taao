'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { INITIAL_STORIES } from '@/data/stories';
import { Chapter, Story, ReaderSettings } from '@/types';
import ReaderSettingsBar from '@/components/ReaderSettingsBar';
import ChapterUnlockModal from '@/components/ChapterUnlockModal';
import PaymentModal from '@/components/PaymentModal';
import AudioPlayerBar from '@/components/AudioPlayerBar';
import { parseChapterContent, SentenceUnit, ParagraphUnit } from '@/lib/sentenceParser';
import {
  getStoredSettings,
  saveStoredSettings,
  saveReadingProgress,
  saveLastReadChapter,
  getUserCoins,
  setUserCoins,
  getUnlockedChapters,
  unlockChapterId,
} from '@/lib/storage';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Settings,
  Lock,
  Sparkles,
  List,
  ArrowLeft,
  Headphones,
  Download,
  CheckCircle,
  X,
  Search,
  Maximize2,
  Minimize2,
  Radio,
  Play,
} from 'lucide-react';
import { LAZIBOOK_NANO_VOICES } from '@/data/voices';
import {
  getImportedStoryBySlug,
  getImportedChapter,
  updateImportedChapterContent,
  ImportedStory,
} from '@/lib/importedBookStorage';
import { cleanChapterContent } from '@/lib/bookTextCleaner';

function ChapterReaderContent() {
  const params = useParams();
  const router = useRouter();

  const slug = params?.slug as string;
  const chapterNum = parseInt(params?.chapterNum as string, 10) || 1;

  const [settings, setSettings] = useState<ReaderSettings>(getStoredSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [showAudio, setShowAudio] = useState(true);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [showToc, setShowToc] = useState(false); // Bottom sheet Mục lục chương
  const [tocSearch, setTocSearch] = useState('');
  const [showControls, setShowControls] = useState(true); // Ẩn/Hiện thanh công cụ (Immersive Reading)
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const [userCoins, setCoins] = useState(50);
  const [unlockedList, setUnlockedList] = useState<string[]>([]);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSavedOffline, setIsSavedOffline] = useState(false);

  // Dynamic chapter content loading state
  const [dynamicContent, setDynamicContent] = useState<string | null>(null);
  const [dynamicTitle, setDynamicTitle] = useState<string | null>(null);
  const [isLoadingChapter, setIsLoadingChapter] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Phân trang cho chế độ "Lật trang như sách thật"
  const [currentPage, setCurrentPage] = useState(0);

  // Pinch-to-zoom & Auto-fit chữ tự động chuẩn e-reader (Kindle / Apple Books)
  const articleRef = React.useRef<HTMLElement | null>(null);
  const isPinchingRef = React.useRef(false);
  const [zoomFeedback, setZoomFeedback] = useState<{ visible: boolean; size: number } | null>(null);
  const zoomFeedbackTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const triggerZoomFeedback = useCallback((size: number) => {
    setZoomFeedback({ visible: true, size });
    if (zoomFeedbackTimerRef.current) clearTimeout(zoomFeedbackTimerRef.current);
    zoomFeedbackTimerRef.current = setTimeout(() => {
      setZoomFeedback((prev) => (prev ? { ...prev, visible: false } : null));
    }, 1200);
  }, []);

  // Đồng bộ ref cỡ chữ để listener native luôn có giá trị mới nhất
  const currentFontSizeRef = React.useRef(settings.fontSize || 18);
  useEffect(() => {
    currentFontSizeRef.current = settings.fontSize || 18;
  }, [settings.fontSize]);

  // Cài đặt Native Gesture & Touch Listeners với { passive: false } BẮT BUỘC để chặn triệt để browser viewport zoom
  useEffect(() => {
    let initialDist: number | null = null;
    let startFontSize = currentFontSizeRef.current;

    // 1. Chặn và xử lý cử chỉ Pinch Zoom trên iOS Safari (gesturestart/gesturechange)
    const onGestureStart = (e: any) => {
      e.preventDefault();
      startFontSize = currentFontSizeRef.current;
      isPinchingRef.current = true;
    };

    const onGestureChange = (e: any) => {
      e.preventDefault();
      if (e.scale) {
        const target = Math.round(startFontSize * e.scale);
        const clamped = Math.max(12, Math.min(64, target));
        if (clamped !== currentFontSizeRef.current) {
          currentFontSizeRef.current = clamped;
          if (articleRef.current) {
            articleRef.current.style.fontSize = `${clamped}px`;
          }
          setSettings((prev) => {
            const next = { ...prev, fontSize: clamped };
            saveStoredSettings(next);
            return next;
          });
          triggerZoomFeedback(clamped);
        }
      }
    };

    const onGestureEnd = (e: any) => {
      e.preventDefault();
      setTimeout(() => {
        isPinchingRef.current = false;
      }, 300);
    };

    // 2. Chặn và xử lý cử chỉ 2 ngón tay Pinch Zoom trên Android Chrome & mobile browsers
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        if (e.cancelable) e.preventDefault(); // Ngăn trình duyệt kích hoạt bộ nhận diện phóng to viewport
        isPinchingRef.current = true;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        startFontSize = currentFontSizeRef.current;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2 && initialDist) {
        // Bắt buộc e.preventDefault() để ngăn trình duyệt phóng to toàn trang gây tràn viền
        if (e.cancelable) {
          e.preventDefault();
        }
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const curDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const ratio = curDist / initialDist;
        const target = Math.round(startFontSize * ratio);
        const clamped = Math.max(12, Math.min(64, target));

        if (clamped !== currentFontSizeRef.current) {
          currentFontSizeRef.current = clamped;
          if (articleRef.current) {
            articleRef.current.style.fontSize = `${clamped}px`;
          }
          setSettings((prev) => {
            const next = { ...prev, fontSize: clamped };
            saveStoredSettings(next);
            return next;
          });
          triggerZoomFeedback(clamped);
        }
      }
    };

    let lastTouchEnd = 0;
    const onTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300 && e.cancelable) {
        e.preventDefault(); // Ngăn double-tap zoom của browser
      }
      lastTouchEnd = now;

      if (e.touches.length < 2 && initialDist !== null) {
        initialDist = null;
        setTimeout(() => {
          isPinchingRef.current = false;
        }, 300);
      }
    };

    // 3. Desktop / Laptop (Ctrl + Cuộn chuột hoặc Touchpad pinch)
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1 : -1;
        const target = Math.max(12, Math.min(64, currentFontSizeRef.current + delta));
        if (target !== currentFontSizeRef.current) {
          currentFontSizeRef.current = target;
          if (articleRef.current) {
            articleRef.current.style.fontSize = `${target}px`;
          }
          setSettings((prev) => {
            const next = { ...prev, fontSize: target };
            saveStoredSettings(next);
            return next;
          });
          triggerZoomFeedback(target);
        }
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
    window.addEventListener('wheel', onWheel, { passive: false });

    // iOS Safari gestures
    window.addEventListener('gesturestart', onGestureStart as any, { passive: false });
    window.addEventListener('gesturechange', onGestureChange as any, { passive: false });
    window.addEventListener('gestureend', onGestureEnd as any, { passive: false });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('gesturestart', onGestureStart as any);
      window.removeEventListener('gesturechange', onGestureChange as any);
      window.removeEventListener('gestureend', onGestureEnd as any);
    };
  }, [triggerZoomFeedback]);

  // Reset khi đổi chương
  useEffect(() => {
    setActiveSentenceIndex(0);
    setCurrentPage(0);
    setDynamicContent(null);
    setDynamicTitle(null);
    setLoadError(null);
    setShowToc(false);
  }, [chapterNum, slug]);

  // Kiểm tra trạng thái lưu offline
  useEffect(() => {
    try {
      const key = `bientruyen_offline_${slug}_chap_${chapterNum}`;
      setIsSavedOffline(Boolean(localStorage.getItem(key)));
    } catch (e) {}
  }, [slug, chapterNum]);

  // Lưu lại vị trí chương hiện tại vào sessionStorage để trang danh sách chương tự động cuộn đến khi back
  useEffect(() => {
    if (slug && chapterNum) {
      try {
        sessionStorage.setItem(`bientruyen_last_chap_${slug}`, String(chapterNum));
      } catch (e) {}
    }
  }, [slug, chapterNum]);

  // Tự động cuộn danh sách Mục Lục (TOC Bottom Sheet) đến chương đang đọc khi mở
  useEffect(() => {
    if (showToc) {
      const timer = setTimeout(() => {
        const item = document.getElementById(`reader-toc-item-${chapterNum}`);
        if (item) {
          item.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showToc, chapterNum]);

  // Lưu chương để đọc ngoại tuyến (Offline 1-Click)
  const handleSaveOffline = () => {
    try {
      const key = `bientruyen_offline_${slug}_chap_${chapterNum}`;
      const payload = {
        title: dynamicTitle || chapter?.title || `Chương ${chapterNum}`,
        content: dynamicContent || chapter?.content || '',
        savedAt: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
      setIsSavedOffline(true);
    } catch (e) {
      console.warn('Lỗi lưu offline:', e);
    }
  };

  // Tự động cuộn êm dịu theo câu đang đọc (Chỉ cuộn khi câu nằm ngoài vùng mắt nhìn thoải mái)
  useEffect(() => {
    if (!showAudio) return;
    const el = document.getElementById(`sent-${activeSentenceIndex}`);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    // Vùng an toàn hiển thị: từ 20% đến 70% chiều cao màn hình, tránh bị che bởi header và player bar
    const isAboveComfortZone = rect.top < vh * 0.20;
    const isBelowComfortZone = rect.bottom > vh * 0.70;

    if (isAboveComfortZone || isBelowComfortZone) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeSentenceIndex, showAudio]);

  const [importedStory, setImportedStory] = useState<ImportedStory | null>(null);

  useEffect(() => {
    if (slug && !INITIAL_STORIES.some((s) => s.slug === slug)) {
      getImportedStoryBySlug(slug).then((res) => {
        if (res) setImportedStory(res);
      });
    }
  }, [slug]);

  // Lấy dữ liệu truyện & chương (Hỗ trợ cả truyện hệ thống và truyện tự nhập)
  const story = useMemo(() => {
    const existing = INITIAL_STORIES.find((s) => s.slug === slug);
    if (existing) return existing;
    if (importedStory) {
      return {
        id: importedStory.id,
        slug: importedStory.slug,
        title: importedStory.title,
        author: importedStory.author,
        description: importedStory.description,
        coverUrl: importedStory.coverUrl || '/covers/default.png',
        categories: importedStory.categories || ['Sách Tự Nhập'],
        chaptersCount: importedStory.chaptersCount || (importedStory.chapters ? importedStory.chapters.length : 0),
        chapters: (importedStory.chapters || []).map((c) => ({
          id: c.id || `chap-${c.number}`,
          number: Number(c.number),
          title: c.title || `Chương ${c.number}`,
          content: cleanChapterContent(c.content || ''),
          wordCount: c.wordCount || 0,
          publishedAt: '2026-10-17',
          isVip: false,
          coinPrice: 0,
        })),
      };
    }
    return null;
  }, [slug, importedStory]);

  const chapters: any[] = useMemo(() => story?.chapters || [], [story]);
  const chapter: any = useMemo(() => {
    const existing = story?.chapters?.find((c: any) => Number(c.number) === chapterNum || String(c.number) === String(chapterNum));
    if (existing) return existing;
    return {
      id: `chap-${chapterNum}`,
      number: chapterNum,
      title: `Chương ${chapterNum}`,
      wordCount: 1500,
      publishedAt: '2026-10-14',
      isVip: false,
      coinPrice: 0,
    };
  }, [story, chapterNum]);

  const prevChapter = useMemo(() => {
    if (chapterNum <= 1) return null;
    return story?.chapters?.find((c) => Number(c.number) === chapterNum - 1) || {
      id: `chap-${chapterNum - 1}`,
      number: chapterNum - 1,
      title: `Chương ${chapterNum - 1}`,
    };
  }, [story, chapterNum]);

  const nextChapter = useMemo(() => {
    const total = story?.chaptersCount || (story?.chapters ? story.chapters.length : 9999);
    if (chapterNum >= total) return null;
    return story?.chapters?.find((c) => Number(c.number) === chapterNum + 1) || {
      id: `chap-${chapterNum + 1}`,
      number: chapterNum + 1,
      title: `Chương ${chapterNum + 1}`,
    };
  }, [story, chapterNum]);

  // Khởi tạo và lưu tiến trình đọc
  useEffect(() => {
    setSettings(getStoredSettings());
    setCoins(getUserCoins());
    setUnlockedList(getUnlockedChapters());

    if (story) {
      saveReadingProgress({
        storySlug: story.slug,
        storyTitle: story.title,
        chapterNumber: chapterNum,
        chapterTitle: dynamicTitle || chapter?.title || `Chương ${chapterNum}`,
        timestamp: Date.now(),
      });
      saveLastReadChapter(story.slug, chapterNum);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [story, chapter, chapterNum, dynamicTitle]);

  // Tự động duy trì phát tiếp audio khi chuyển chương (Continuous Audiobook Autoplay)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlHasAudio = window.location.search.includes('audio=1');
      const sessionAutoplay = sessionStorage.getItem('bientruyen_audio_autoplay') === 'true';
      if (urlHasAudio || sessionAutoplay) {
        setShowAudio(true);
        setAutoPlayAudio(true);
        setActiveSentenceIndex(0);
      }
    }
  }, [chapterNum]);

  // Tải nội dung chương On-Demand (Tối ưu kết nối Mobile, Truyện Tự Nhập & Cache Offline)
  useEffect(() => {
    if (!slug) return;
    let isCancelled = false;

    async function loadChapterContent() {
      setIsLoadingChapter(true);
      setLoadError(null);

      // 0. Ưu tiên kiểm tra nếu là chương của truyện tự nhập (IndexedDB / LocalStorage)
      try {
        const customChap = await getImportedChapter(slug, chapterNum);
        if (customChap) {
          if (customChap.content && customChap.content.length > 10) {
            if (!isCancelled) {
              setDynamicContent(customChap.content);
              if (customChap.title) setDynamicTitle(customChap.title);
              setIsLoadingChapter(false);
            }
            return;
          } else if (customChap.url) {
            // Crawl on-demand từ remote URL nếu nội dung chưa nạp sẵn
            try {
              const crawlRes = await fetch(`/api/import/chapter?url=${encodeURIComponent(customChap.url)}`);
              const crawlData = await crawlRes.json();
              if (crawlData.success && crawlData.content) {
                if (!isCancelled) {
                  setDynamicContent(crawlData.content);
                  if (crawlData.title) setDynamicTitle(crawlData.title);
                  await updateImportedChapterContent(slug, chapterNum, crawlData.content);
                  setIsLoadingChapter(false);
                }
                return;
              } else if (!isCancelled) {
                setLoadError('Không thể tải chương từ link web nguồn.');
                setIsLoadingChapter(false);
                return;
              }
            } catch (e) {
              if (!isCancelled) {
                setLoadError('Lỗi kết nối khi tải chương từ web.');
                setIsLoadingChapter(false);
                return;
              }
            }
          }
        }
      } catch (e) {
        console.warn('Lỗi đọc chương tự nhập:', e);
      }

      // 1. Kiểm tra cache offline trong localStorage
      try {
        const offlineKey = `bientruyen_offline_${slug}_chap_${chapterNum}`;
        const cached = localStorage.getItem(offlineKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.content) {
            if (!isCancelled) {
              setDynamicContent(parsed.content);
              if (parsed.title) setDynamicTitle(parsed.title);
              setIsLoadingChapter(false);
            }
            return;
          }
        }
      } catch (e) {}

      // 2. Nếu đã có sẵn trong danh sách chapters của story
      if (chapter?.content && chapter.content.length > 50) {
        if (!isCancelled) {
          setDynamicContent(null);
          setDynamicTitle(null);
          setIsLoadingChapter(false);
        }
        return;
      }

      // 3. Nếu là truyện tự nhập nhưng không có chương này
      const isSystemStory = INITIAL_STORIES.some((s) => s.slug === slug);
      if (!isSystemStory && !importedStory) {
        // Đang chờ nạp importedStory từ IndexedDB, không vội gọi API
        return;
      }
      if (!isSystemStory && importedStory) {
        if (!isCancelled) {
          setLoadError(`Không tìm thấy nội dung chương ${chapterNum} trong tệp sách này.`);
          setIsLoadingChapter(false);
        }
        return;
      }

      // 4. Nếu là truyện hệ thống, gọi API
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`/api/v1/stories/${encodeURIComponent(slug)}/chapters/${chapterNum}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.chapter && !isCancelled) {
            setDynamicContent(data.chapter.content);
            if (data.chapter.title) setDynamicTitle(data.chapter.title);
            setIsLoadingChapter(false);
            return;
          }
        }

        // Dự phòng legacy API
        const legacyRes = await fetch(`/api/story-chapter?slug=${encodeURIComponent(slug)}&chapter=${chapterNum}`);
        const legacyData = await legacyRes.json();
        if (legacyData.success && legacyData.chapter && !isCancelled) {
          setDynamicContent(legacyData.chapter.content);
          if (legacyData.chapter.title) setDynamicTitle(legacyData.chapter.title);
          setIsLoadingChapter(false);
          return;
        }

        if (!isCancelled) {
          setLoadError('Lỗi khi tải nội dung chương từ hệ thống.');
          setIsLoadingChapter(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setLoadError(err.message || 'Lỗi kết nối khi tải chương');
          setIsLoadingChapter(false);
        }
      }
    }

    loadChapterContent();
    return () => {
      isCancelled = true;
    };
  }, [slug, chapterNum, chapter?.content, importedStory]);

  const handleSettingsChange = (newSettings: ReaderSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const isVipLocked = Boolean(
    chapter?.isVip && chapter?.id && !unlockedList.includes(chapter.id)
  );

  const handleUnlock = () => {
    if (!chapter) return;
    const price = chapter.coinPrice || 10;
    if (userCoins >= price) {
      const remaining = userCoins - price;
      setUserCoins(remaining);
      setCoins(remaining);
      unlockChapterId(chapter.id);
      setUnlockedList([...unlockedList, chapter.id]);
      setShowUnlockModal(false);
    }
  };

  const goToPrev = useCallback(() => {
    if (prevChapter && story) {
      router.replace(`/truyen/${story.slug}/chuong/${prevChapter.number}`);
    }
  }, [prevChapter, story, router]);

  const goToNext = useCallback(() => {
    if (nextChapter && story) {
      router.replace(`/truyen/${story.slug}/chuong/${nextChapter.number}`);
    }
  }, [nextChapter, story, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext]);

  // Cấu hình 6 bộ Theme Tiên Hiệp & Êm Mắt Sách Giấy
  const themeStyles = {
    sepia: {
      wrapper: 'bg-[#f7f0e0] text-[#2d2218]', // Hoàng Chỉ Cổ Thư
      card: 'bg-[#efe5ce]/90 border-[#dfd2b5]',
      accent: 'text-amber-800',
      border: 'border-[#dfd2b5]',
      navBtn: 'bg-[#eedfc4] hover:bg-[#e4d2b2] text-[#2d2218] border-[#d5c3a3]',
      highlight: 'bg-amber-400/40 text-[#20150b] font-bold underline decoration-amber-700/80 decoration-2 underline-offset-4 rounded px-1 py-0.5',
    },
    light: {
      wrapper: 'bg-[#fbfaf6] text-[#1c1917]', // Bạch Ngọc Thư Trai
      card: 'bg-white border-neutral-200',
      accent: 'text-amber-600',
      border: 'border-neutral-200',
      navBtn: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300',
      highlight: 'bg-amber-300/50 text-[#111827] font-bold underline decoration-amber-600 decoration-2 underline-offset-4 rounded px-1 py-0.5',
    },
    emerald: {
      wrapper: 'bg-[#eaf4ec] text-[#193a28]', // Bích Thạch Dịu Mắt
      card: 'bg-[#d8eedc]/90 border-[#bcdbc3]',
      accent: 'text-emerald-700',
      border: 'border-[#bcdbc3]',
      navBtn: 'bg-[#daf0df] hover:bg-[#cbe8d2] text-[#193a28] border-[#b0d6b9]',
      highlight: 'bg-emerald-300/40 text-[#092213] font-bold underline decoration-emerald-600 decoration-2 underline-offset-4 rounded px-1 py-0.5',
    },
    gray: {
      wrapper: 'bg-[#0f172a] text-[#cbd5e1]', // Tiên Động Xám Đá
      card: 'bg-[#1e293b]/90 border-[#334155]',
      accent: 'text-emerald-400',
      border: 'border-[#334155]',
      navBtn: 'bg-[#1e293b] hover:bg-[#334155] text-emerald-200 border-[#475569]',
      highlight: 'bg-amber-400/30 text-amber-200 font-bold underline decoration-amber-400 decoration-2 underline-offset-4 rounded px-1 py-0.5',
    },
    dark: {
      wrapper: 'bg-[#070a12] text-[#cbd5e1]', // Huyền Thiên Tinh Tú
      card: 'bg-[#0f1422] border-amber-900/30',
      accent: 'text-amber-400',
      border: 'border-neutral-800/80',
      navBtn: 'bg-[#151c2e] hover:bg-[#1e2740] text-amber-200 border-amber-800/40',
      highlight: 'bg-amber-400/30 text-amber-200 font-bold underline decoration-amber-400 decoration-2 underline-offset-4 rounded px-1 py-0.5',
    },
    oled: {
      wrapper: 'bg-black text-[#e4e4e7]', // OLED Black #000000
      card: 'bg-[#0a0a0a] border-neutral-900',
      accent: 'text-amber-400',
      border: 'border-neutral-900',
      navBtn: 'bg-[#121212] hover:bg-[#1a1a1a] text-[#e4e4e7] border-neutral-800',
      highlight: 'bg-amber-400/30 text-amber-200 font-bold underline decoration-amber-400 decoration-2 underline-offset-4 rounded px-1 py-0.5',
    },
  }[settings.theme] || {
    wrapper: 'bg-[#f7f0e0] text-[#2d2218]',
    card: 'bg-[#efe5ce]/90 border-[#dfd2b5]',
    accent: 'text-amber-800',
    border: 'border-[#dfd2b5]',
    navBtn: 'bg-[#eedfc4] hover:bg-[#e4d2b2] text-[#2d2218] border-[#d5c3a3]',
    highlight: 'bg-amber-400/40 text-[#20150b] font-bold underline decoration-amber-700/80 decoration-2 underline-offset-4 rounded px-1 py-0.5',
  };

  const fontClass =
    {
      lora: 'font-lora',
      'be-vietnam': 'font-be-vietnam',
      merriweather: 'font-merriweather',
      nunito: 'font-nunito',
      serif: 'font-lora',
      sans: 'font-be-vietnam',
    }[settings.fontFamily] || 'font-lora';

  const effectiveContent = dynamicContent || chapter?.content || '';
  const effectiveTitle = dynamicTitle || chapter?.title || `Chương ${chapterNum}`;

  // Phân tích nội dung theo cấu trúc Karaoke Sentence (Hook luôn gọi ở cấp cao nhất)
  const { paragraphs, flatSentences } = useMemo(() => {
    if (!effectiveContent && !story) return { paragraphs: [], flatSentences: [] };
    return parseChapterContent(effectiveContent, effectiveTitle, chapterNum);
  }, [effectiveContent, effectiveTitle, chapterNum, story]);

  // Phân trang cho chế độ "Lật trang" (Hook luôn gọi ở cấp cao nhất)
  const PARAS_PER_PAGE = 4;
  const totalPages = Math.max(1, Math.ceil((paragraphs?.length || 0) / PARAS_PER_PAGE));
  const pagedParagraphs = useMemo(() => {
    if (!paragraphs) return [];
    if (settings.readMode !== 'page') return paragraphs;
    const start = currentPage * PARAS_PER_PAGE;
    return paragraphs.slice(start, start + PARAS_PER_PAGE);
  }, [paragraphs, settings.readMode, currentPage]);

  // Tự động lật trang khi nghe Audio (Hook luôn gọi ở cấp cao nhất)
  useEffect(() => {
    if (settings.readMode === 'page' && showAudio && flatSentences && flatSentences[activeSentenceIndex]) {
      const pIdx = flatSentences[activeSentenceIndex].paragraphIndex;
      const targetPage = Math.floor(pIdx / PARAS_PER_PAGE);
      if (targetPage !== currentPage && targetPage >= 0 && targetPage < totalPages) {
        setCurrentPage(targetPage);
      }
    }
  }, [activeSentenceIndex, showAudio, settings.readMode, flatSentences, currentPage, totalPages]);

  // Lọc mục lục chương (Hook luôn gọi ở cấp cao nhất)
  const filteredChapters = useMemo(() => {
    if (!chapters || !Array.isArray(chapters)) return [];
    if (!tocSearch.trim()) return chapters;
    const q = tocSearch.toLowerCase().trim();
    return chapters.filter(c => c?.title?.toLowerCase().includes(q) || c?.number?.toString().includes(q));
  }, [chapters, tocSearch]);

  // Màn hình loading khi truyện tự nhập đang nạp dữ liệu từ IndexedDB
  if (!story && (isLoadingChapter || !dynamicContent)) {
    return (
      <div className={`min-h-screen ${themeStyles.wrapper} flex flex-col items-center justify-center py-20 px-4 text-center space-y-4`}>
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto animate-pulse">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold">Đang tải sách...</h2>
        <p className="text-xs opacity-70 max-w-sm">
          Đang đồng bộ dữ liệu chương từ bộ nhớ thiết bị. Xin đợi trong giây lát...
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeStyles.wrapper} w-full px-2 sm:px-6 lg:px-8 pt-0 ${showAudio ? 'pb-44 sm:pb-36' : 'pb-24'}`}>
      
      {/* 1. Top Reading Navigation Bar - TỐI GIẢN CHUẨN NATIVE MOBILE */}
      <div className={`max-w-3xl mx-auto sticky top-0 z-30 pt-1.5 pb-2 transition-all duration-300 ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center justify-between px-3 py-1.5 rounded-2xl backdrop-blur-xl shadow-md border ${themeStyles.card}`}>
          {/* Nút quay lại & Tiêu đề chương tối giản */}
          <div className="flex items-center space-x-2 truncate mr-2">
            <button
              type="button"
              onClick={() => {
                const targetSlug = story?.slug || slug;
                try {
                  sessionStorage.setItem(`bientruyen_last_chap_${targetSlug}`, String(chapterNum));
                  sessionStorage.removeItem('bientruyen_audio_autoplay');
                } catch (e) {}
                router.push(`/truyen/${targetSlug}#chapter-${chapterNum}`);
              }}
              className="w-8 h-8 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center justify-center shrink-0 cursor-pointer"
              title="Về danh sách chương (Nhớ vị trí)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="truncate">
              <span className="text-xs sm:text-sm font-black truncate block">
                Chương {chapterNum}
              </span>
              <span className="text-[10px] opacity-60 truncate block hidden sm:block">
                {story?.title || 'Đang tải...'}
              </span>
            </div>
          </div>

          {/* Cụm công cụ tối giản: Chỉ 3 nút quan trọng nhất (Audio, Cài đặt, Mục lục) */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
            {/* Bật/Tắt Audio */}
            <button
              type="button"
              onClick={() => {
                const next = !showAudio;
                setShowAudio(next);
                if (next) setAutoPlayAudio(true);
              }}
              className={`p-2 rounded-xl transition flex items-center gap-1 text-xs font-bold ${
                showAudio
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'hover:bg-black/5 dark:hover:bg-white/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              }`}
              title="Bật/Tắt Nghe Audio"
            >
              <Headphones className="w-4 h-4" />
              <span className="hidden sm:inline">Audio</span>
            </button>

            {/* Thu nhỏ / Phóng to chữ nhanh chuẩn App Sách (12px - 64px) */}
            <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-xl p-0.5 border border-current/10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = Math.max(12, settings.fontSize - 2);
                  const updated = { ...settings, fontSize: next };
                  setSettings(updated);
                  saveStoredSettings(updated);
                  triggerZoomFeedback(next);
                }}
                className="w-7 h-7 rounded-lg hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-[11px] font-black cursor-pointer"
                title="Thu nhỏ chữ (tối thiểu 12px)"
              >
                A-
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = Math.min(64, settings.fontSize + 2);
                  const updated = { ...settings, fontSize: next };
                  setSettings(updated);
                  saveStoredSettings(updated);
                  triggerZoomFeedback(next);
                }}
                className="w-7 h-7 rounded-lg hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-[11px] font-black cursor-pointer"
                title="Phóng to chữ (tối đa 64px)"
              >
                A+
              </button>
            </div>

            {/* Cài đặt Font chữ / Màu nền */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl transition flex items-center gap-1 text-xs font-bold ${
                showSettings
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'hover:bg-black/5 dark:hover:bg-white/10 opacity-80 hover:opacity-100'
              }`}
              title="Cỡ chữ & Giao diện"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Mục lục chương Drawer */}
            <button
              type="button"
              onClick={() => setShowToc(true)}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center gap-1 text-xs font-bold opacity-80 hover:opacity-100"
              title="Mục lục chương"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thanh Cài Đặt Đọc (Kèm Tải Offline) */}
        {showSettings && (
          <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <ReaderSettingsBar
              settings={settings}
              onChange={handleSettingsChange}
            />
            {/* Nút Tải Offline tích hợp trong thanh cài đặt */}
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveOffline}
                className={`py-1.5 px-3 rounded-xl transition flex items-center space-x-1.5 text-xs font-bold border ${
                  isSavedOffline
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                    : 'bg-black/5 dark:bg-white/5 border-neutral-300 dark:border-neutral-700 opacity-80 hover:opacity-100'
                }`}
              >
                {isSavedOffline ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Đã lưu offline chương này</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải chương này đọc offline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Chapter Content - Tràn viền fit trọn màn hình mobile & e-reader */}
      <main className="w-full max-w-3xl mx-auto px-1 sm:px-4 overflow-hidden">
        {/* Tiêu đề chương gọn gàng, tinh tế */}
        <div className="text-center pt-2 pb-3 border-b border-current/10 mb-4 space-y-1">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
            {effectiveTitle}
          </h1>
          <div className="text-[11px] opacity-60 flex items-center justify-center space-x-2 pt-0.5">
            <span>{effectiveContent.length > 0 ? `${Math.round(effectiveContent.length / 5)} chữ` : `${chapter?.wordCount || '...'} chữ`}</span>
            {showAudio && (
              <>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                  <Headphones className="w-3 h-3" />
                  Chạm câu để nghe
                </span>
              </>
            )}
          </div>
        </div>

        {/* Loading */}
        {isLoadingChapter && (
          <div className="py-20 text-center space-y-3 animate-in fade-in duration-300">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent"></div>
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Đang tải nội dung chương {chapterNum}...
            </h3>
            <p className="text-xs opacity-75 max-w-xs mx-auto">
              Chuẩn hóa văn phong tiếng Việt tự động cho trải nghiệm đọc mượt mà.
            </p>
          </div>
        )}

        {/* Lỗi khi tải chương */}
        {loadError && (
          <div className="py-10 px-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-center space-y-3 my-4">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              {loadError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition"
            >
              Thử lại ngay
            </button>
          </div>
        )}

        {/* Nội dung chương */}
        {!isLoadingChapter && !loadError && (
          isVipLocked ? (
            <div className={`p-6 sm:p-8 rounded-3xl border text-center space-y-4 my-8 shadow-lg ${themeStyles.card}`}>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold">Chương VIP ({chapter.coinPrice || 10} Xu)</h3>
              <p className="text-xs opacity-80 max-w-sm mx-auto">
                Mở khóa để tiếp tục theo dõi diễn biến hồi hộp của truyện!
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setShowUnlockModal(true)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25"
                >
                  Mở Khóa Chương ({chapter.coinPrice || 10} Xu)
                </button>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs border border-amber-500/40 text-amber-600 dark:text-amber-400"
                >
                  Nạp Xu
                </button>
              </div>
            </div>
          ) : (
            <article
              ref={articleRef}
              onClick={() => {
                if (!isPinchingRef.current) {
                  setShowControls(!showControls);
                }
              }}
              className={`w-full max-w-full overflow-hidden break-words space-y-5 sm:space-y-6 ${fontClass} select-text leading-relaxed tracking-normal cursor-pointer`}
              style={{
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                hyphens: 'auto',
                width: '100%',
                maxWidth: '100%',
                touchAction: 'pan-y',
              }}
            >
              {pagedParagraphs.map((p) => {
                return (
                  <p
                    key={p.id}
                    id={`para-${p.id}`}
                    className="w-full max-w-full indent-5 sm:indent-8 text-justify rounded-xl py-1 px-0.5 break-words"
                    style={{
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {p.sentences.map((sent) => {
                      const isSpeaking = showAudio && activeSentenceIndex === sent.id;
                      return (
                        <span
                          key={sent.id}
                          id={`sent-${sent.id}`}
                          onClick={(e) => {
                            if (showAudio) {
                              e.stopPropagation();
                              setActiveSentenceIndex(sent.id);
                            }
                          }}
                          className={`transition-colors duration-300 inline box-decoration-clone ${
                            isSpeaking
                              ? themeStyles.highlight
                              : showAudio
                              ? 'hover:opacity-80 cursor-pointer'
                              : ''
                          }`}
                        >
                          {sent.text}{' '}
                        </span>
                      );
                    })}
                  </p>
                );
              })}
            </article>
          )
        )}

        {/* Floating Zoom / Auto-fit HUD Indicator chuẩn e-reader */}
        {zoomFeedback?.visible && (
          <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-black/90 text-white backdrop-blur-xl px-5 py-2.5 rounded-2xl shadow-2xl border border-amber-500/30 flex items-center gap-3">
              <Maximize2 className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Tự động co dòng ôm khít</span>
                <span className="text-base font-black text-white">Cỡ chữ: {zoomFeedback.size}px</span>
              </div>
            </div>
          </div>
        )}

        {/* Thanh Điều Hướng Lật Trang (Chế độ Page) */}
        {settings.readMode === 'page' && totalPages > 1 && (
          <div className="mt-6 p-2.5 rounded-2xl border flex items-center justify-between shadow-sm bg-black/5 dark:bg-white/5">
            <button
              onClick={() => {
                setCurrentPage((p) => Math.max(0, p - 1));
                window.scrollTo({ top: 100, behavior: 'smooth' });
              }}
              disabled={currentPage <= 0}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border disabled:opacity-30 transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Trang trước</span>
            </button>

            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              Trang {currentPage + 1} / {totalPages}
            </span>

            <button
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
                window.scrollTo({ top: 100, behavior: 'smooth' });
              }}
              disabled={currentPage >= totalPages - 1}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border disabled:opacity-30 transition flex items-center gap-1"
            >
              <span>Trang sau</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Chuyển chương cuối trang */}
        <div className="mt-10 pt-6 border-t border-current/10">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {prevChapter ? (
              <button
                onClick={goToPrev}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center space-x-1 transition ${themeStyles.navBtn}`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Chương trước</span>
              </button>
            ) : (
              <div className="flex-1 opacity-30 text-center py-2.5 text-xs font-bold">
                Chương đầu
              </div>
            )}

            <button
              onClick={() => setShowToc(true)}
              className={`py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center space-x-1 transition ${themeStyles.navBtn}`}
            >
              <List className="w-4 h-4" />
              <span>Mục lục</span>
            </button>

            {nextChapter ? (
              <button
                onClick={goToNext}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center space-x-1 transition ${themeStyles.navBtn}`}
              >
                <span>Chương sau</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex-1 opacity-30 text-center py-2.5 text-xs font-bold">
                Mới nhất
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 3. Bottom Sheet Mục Lục Chương (Mobile Drawer như App thật) */}
      {showToc && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md max-h-[85vh] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl p-4 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Header Sheet */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Mục lục ({chapters.length} chương)
                </h3>
              </div>
              <button
                onClick={() => setShowToc(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tìm kiếm chương */}
            <div className="relative my-3">
              <input
                type="text"
                value={tocSearch}
                onChange={(e) => setTocSearch(e.target.value)}
                placeholder="Nhập số chương hoặc tên chương..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Danh sách chương scroll */}
            <div className="overflow-y-auto space-y-1 flex-1 pr-1 custom-scrollbar">
              {filteredChapters.map((c) => {
                const isCurrent = c.number === chapterNum;
                return (
                  <button
                    key={c.id}
                    id={`reader-toc-item-${c.number}`}
                    onClick={() => {
                      setShowToc(false);
                      router.push(`/truyen/${story.slug}/chuong/${c.number}`);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                      isCurrent
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 font-bold'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <span className="truncate pr-2">{c.title}</span>
                    {isCurrent ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white shrink-0">
                        Đang đọc
                      </span>
                    ) : c.isVip ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 shrink-0">
                        VIP
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Mở Khóa Chương VIP */}
      {chapter && (
        <ChapterUnlockModal
          isOpen={showUnlockModal}
          chapter={chapter}
          userCoins={userCoins}
          onClose={() => setShowUnlockModal(false)}
          onUnlock={handleUnlock}
          onOpenPayment={() => {
            setShowUnlockModal(false);
            setShowPaymentModal(true);
          }}
        />
      )}

      {/* Modal Nạp Tiền VietQR */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onBalanceUpdated={(newCoins) => setCoins(newCoins)}
      />


      {/* Trình Phát Audio AI Đồng Bộ Karaoke */}
      {showAudio && flatSentences.length > 0 && (
        <AudioPlayerBar
          sentences={flatSentences}
          chapterTitle={chapter?.title || dynamicTitle || `Chương ${chapterNum}`}
          storyTitle={story?.title || 'Tả Ao Reader'}
          coverUrl={story?.coverUrl || '/covers/default.png'}
          activeSentenceIndex={activeSentenceIndex}
          autoPlayOnMount={autoPlayAudio}
          onSentenceChange={setActiveSentenceIndex}
          onNextChapter={() => {
            if (nextChapter) {
              try {
                sessionStorage.setItem('bientruyen_audio_autoplay', 'true');
              } catch (e) {}
              router.replace(`/truyen/${story?.slug || slug}/chuong/${nextChapter.number}?audio=1`);
            }
          }}
          onClose={() => {
            setShowAudio(false);
            setAutoPlayAudio(false);
            try {
              sessionStorage.removeItem('bientruyen_audio_autoplay');
            } catch (e) {}
          }}
        />
      )}
    </div>
  );
}

export default function ChapterReaderPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-neutral-400">Đang chuẩn hóa chương truyện...</div>}>
      <ChapterReaderContent />
    </Suspense>
  );
}
