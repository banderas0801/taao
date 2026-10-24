'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { INITIAL_STORIES } from '@/data/stories';
import { Story, ReadingProgress } from '@/types';
import { getReadingProgress } from '@/lib/storage';
import {
  BookOpen,
  Star,
  Eye,
  Flame,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  Clock,
  Search,
  X,
  Headphones,
  Sparkles,
  SlidersHorizontal,
  Home,
  Library,
  Coins,
  BookPlus,
  Trash2,
  UploadCloud
} from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';
import ImportBookModal from '@/components/ImportBookModal';
import { getAllImportedStories, deleteImportedStory, saveImportedStory, ImportedStorySummary } from '@/lib/importedBookStorage';

function HomeContent() {
  const searchParams = useSearchParams();
  const initialStatusParam = searchParams.get('status') || 'all';
  const initialCategoryParam = searchParams.get('category') || 'Tất cả';
  const initialSearchParam = searchParams.get('q') || '';

  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatusParam);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryParam);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchParam);
  const [sortBy, setSortBy] = useState<'views' | 'rating' | 'chapters' | 'updated'>('views');
  const [readingList, setReadingList] = useState<ReadingProgress[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedStories, setImportedStories] = useState<ImportedStorySummary[]>([]);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'loading' | 'success' | 'error' } | null>(null);

  // Tự động đồng bộ từ Mặc Canh Studio qua Cầu Nối Hệ Sinh Thái (1-Click Ecosystem Sync)
  useEffect(() => {
    const fromMaccanh = searchParams.get('from_maccanh');
    const maccanhUrl = searchParams.get('maccanh_url') || (typeof window !== 'undefined' && window.location.hostname.includes('makeno.space') ? 'https://maccanh.makeno.space' : 'http://localhost:3000');

    if (fromMaccanh) {
      let active = true;
      const doSync = async () => {
        setSyncToast({ message: 'Đang kết nối và đồng bộ tác phẩm từ Mặc Cảnh Studio...', type: 'loading' });
        try {
          const res = await fetch(`${maccanhUrl}/api/v1/projects/${encodeURIComponent(fromMaccanh)}/export-taao`);
          if (!res.ok) throw new Error('Không thể kết nối đến Mặc Cảnh');
          const data = await res.json();
          if (data && data.success && data.story) {
            await saveImportedStory(data.story);
            if (!active) return;
            setSyncToast({ message: `Đã đồng bộ "${data.story.title}" thành công! Đang chuyển đến chương 1...`, type: 'success' });
            setTimeout(() => {
              window.location.href = `/truyen/${data.story.slug}/chuong/1`;
            }, 1200);
          } else {
            throw new Error(data?.message || 'Không tìm thấy dữ liệu truyện');
          }
        } catch (err: any) {
          if (!active) return;
          console.error('Lỗi đồng bộ Mặc Cảnh:', err);
          setSyncToast({ message: 'Lỗi đồng bộ: ' + (err.message || 'Không thể tải tác phẩm'), type: 'error' });
          setTimeout(() => setSyncToast(null), 4000);
        }
      };
      doSync();
      return () => { active = false; };
    }
  }, [searchParams]);

  const loadImported = React.useCallback(async () => {
    try {
      const list = await getAllImportedStories();
      setImportedStories(list);
    } catch (e) {
      console.warn('Lỗi đọc truyện tự nhập:', e);
    }
  }, []);

  useEffect(() => {
    setReadingList(getReadingProgress());
    loadImported();
  }, [loadImported]);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status) setSelectedStatus(status);
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  const categories = [
    'Tất cả',
    'Sách Tự Nhập',
    'Tiên Hiệp',
    'Huyền Huyễn',
    'Mạt Thế',
    'Đô Thị',
    'Xuyên Không',
    'Trọng Sinh',
    'Nữ Cường',
    'Khoa học viễn tưởng'
  ];

  // Tổng hợp toàn bộ truyện (gốc + tự nhập)
  const allStories = useMemo(() => {
    const customList = importedStories.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      author: s.author,
      description: s.description,
      coverUrl: s.coverUrl || '/covers/default.png',
      categories: s.categories || ['Sách Tự Nhập'],
      status: 'Tự nhập',
      views: 1,
      rating: 5.0,
      ratingCount: 1,
      chaptersCount: s.chaptersCount,
      updatedAt: new Date(s.importedAt).toISOString(),
      isImported: true,
      sourceType: s.sourceType,
    }));
    return [...customList, ...INITIAL_STORIES];
  }, [importedStories]);

  const totalCount = allStories.length;
  const completedCount = useMemo(
    () => allStories.filter((s) => s.status === 'Hoàn thành').length,
    [allStories]
  );
  const ongoingCount = useMemo(
    () => allStories.filter((s) => s.status === 'Đang ra').length,
    [allStories]
  );

  // Lọc và Sắp xếp danh sách truyện
  const filteredStories = useMemo(() => {
    return allStories.filter((story: any) => {
      if (selectedCategory === 'Sách Tự Nhập') {
        return story.isImported;
      }
      if (selectedStatus !== 'all' && story.status !== selectedStatus) {
        return false;
      }
      if (selectedCategory !== 'Tất cả' && !story.categories.includes(selectedCategory)) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = story.title.toLowerCase().includes(q);
        const matchAuthor = story.author.toLowerCase().includes(q);
        const matchDesc = story.description.toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor && !matchDesc) return false;
      }
      return true;
    }).sort((a: any, b: any) => {
      if (a.isImported && !b.isImported) return -1;
      if (!a.isImported && b.isImported) return 1;
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'chapters') return (b.chapters?.length || b.chaptersCount || 0) - (a.chapters?.length || a.chaptersCount || 0);
      if (sortBy === 'updated') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return 0;
    });
  }, [allStories, selectedStatus, selectedCategory, searchQuery, sortBy]);

  const handleDeleteImported = async (e: React.MouseEvent, storySlug: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa bộ truyện tự nhập này khỏi thư viện?')) {
      await deleteImportedStory(storySlug);
      await loadImported();
    }
  };

  const featuredStory = INITIAL_STORIES[0];

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 sm:pb-16 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6">
      {/* Thông báo Đồng bộ Hệ sinh thái Mặc Cảnh */}
      {syncToast && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold shadow-lg animate-in slide-in-from-top-3 duration-300 ${
            syncToast.type === 'loading'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : syncToast.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{syncToast.type === 'loading' ? '⏳' : syncToast.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{syncToast.message}</span>
          </div>
          {syncToast.type !== 'loading' && (
            <button onClick={() => setSyncToast(null)} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 1. Lịch sử đang đọc dở (Compact & Native style) */}
      {readingList.length > 0 && (
        <section className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-amber-800 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Bookmark className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Tiếp tục đọc</span>
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-400 opacity-80">
              {readingList.length} truyện
            </span>
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-1">
            {readingList.slice(0, 4).map((item, idx) => (
              <Link
                key={idx}
                href={`/truyen/${item.storySlug}/chuong/${item.chapterNumber}`}
                className="shrink-0 w-56 sm:w-64 flex items-center justify-between p-2.5 rounded-xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800 hover:border-amber-500 transition shadow-sm"
              >
                <div className="truncate mr-2">
                  <div className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                    {item.storyTitle}
                  </div>
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 truncate mt-0.5">
                    {item.chapterTitle}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 2. Hero Featured Story - Tối ưu 100% hiển thị bìa truyện trên cả Mobile & Desktop */}
      <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 text-white p-4 sm:p-7 shadow-xl border border-amber-500/30">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative z-10">
          {/* Bìa truyện hiển thị đẹp mắt ngay trên mobile */}
          <Link
            href={`/truyen/${featuredStory.slug}`}
            className="shrink-0 w-32 sm:w-44 h-44 sm:h-60 rounded-xl overflow-hidden shadow-2xl border border-amber-500/30 relative group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featuredStory.coverUrl}
              alt={featuredStory.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
            <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow">
              Đề cử
            </div>
          </Link>

          {/* Chi tiết truyện */}
          <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                <span>Hoàn Thành</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Headphones className="w-3 h-3" />
                <span>Audio AI Đồng Bộ</span>
              </span>
            </div>

            <Link href={`/truyen/${featuredStory.slug}`} className="block">
              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white hover:text-amber-400 transition truncate">
                {featuredStory.title}
              </h1>
            </Link>

            <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 leading-relaxed">
              {featuredStory.description}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs text-neutral-400 pt-0.5">
              <span className="text-amber-400 font-bold flex items-center">
                <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                {featuredStory.rating}
              </span>
              <span>•</span>
              <span>{(featuredStory.views / 1000).toFixed(0)}k đọc</span>
              <span>•</span>
              <span className="text-white font-medium">{featuredStory.author}</span>
            </div>

            {/* Cụm nút hành động không bao giờ bị vỡ dòng */}
            <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-2">
              {(() => {
                const featuredProgress = readingList.find((p) => p.storySlug === featuredStory.slug);
                const featuredLastChap = featuredProgress?.chapterNumber;
                return (
                  <>
                    <Link
                      href={featuredLastChap && featuredLastChap > 0 ? `/truyen/${featuredStory.slug}/chuong/${featuredLastChap}` : `/truyen/${featuredStory.slug}/chuong/1`}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/25 transition text-center"
                    >
                      {featuredLastChap && featuredLastChap > 0 ? `Đọc Tiếp Chương ${featuredLastChap}` : 'Đọc Từ Chương 1'}
                    </Link>
                    <Link
                      href={`/truyen/${featuredStory.slug}?info=1`}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white transition text-center"
                    >
                      Chi Tiết
                    </Link>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Thanh Thể Loại Trượt Ngang (LaziBook Style - Vuốt cực êm trên Mobile) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Khám phá theo thể loại
          </span>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            {filteredStories.length} tác phẩm
          </span>
        </div>

        <div className="flex overflow-x-auto no-scrollbar gap-2 py-1 -mx-2 px-2 items-center">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white flex items-center gap-1.5 shadow-md shadow-amber-500/25 transition active:scale-95 cursor-pointer"
            title="Thêm sách từ tệp tin hoặc link web"
          >
            <BookPlus className="w-3.5 h-3.5" />
            <span>+ Thêm Sách</span>
          </button>

          <Link
            href="/thu-vien"
            className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition active:scale-95"
            title="Quản lý thư viện, sửa thông tin, xóa sách"
          >
            <Library className="w-3.5 h-3.5 text-amber-500" />
            <span>Quản Lý Thư Viện ({importedStories.length})</span>
          </Link>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = cat === 'Sách Tự Nhập' ? importedStories.length : undefined;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-amber-400'
                }`}
              >
                <span>{cat}</span>
                {count !== undefined && count > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Bộ Lọc Trạng Thái & Ô Tìm Kiếm Hiện Đại (Gọn gàng, không thô) */}
      <section className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        {/* Ô Tìm Kiếm Nhanh */}
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên truyện, tác giả, nội dung..."
            className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bộ Lọc Tabs: Trạng thái & Sắp xếp */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
          {/* Trạng thái Segmented */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl p-0.5 text-xs">
            {[
              { id: 'all', label: `Tất cả (${totalCount})` },
              { id: 'Hoàn thành', label: `Full (${completedCount})` },
              { id: 'Đang ra', label: `Đang ra (${ongoingCount})` },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition text-[11px] sm:text-xs ${
                  selectedStatus === st.id
                    ? 'bg-white dark:bg-neutral-700 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Sắp xếp Dropdown */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-neutral-400 hidden xs:inline">Xếp theo:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
            >
              <option value="views">Lượt xem nhiều</option>
              <option value="rating">Đánh giá cao</option>
              <option value="chapters">Số chương</option>
              <option value="updated">Mới cập nhật</option>
            </select>
          </div>
        </div>
      </section>

      {/* 5. Kho Truyện (Library Grid - LaziBook Book Grid Style) */}
      <section className="space-y-4">
        {filteredStories.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800">
            <BookOpen className="w-10 h-10 text-neutral-400 mx-auto" />
            <h3 className="text-base font-bold text-neutral-700 dark:text-neutral-300">
              Không tìm thấy truyện phù hợp
            </h3>
            <p className="text-xs text-neutral-400">
              Thử xóa bộ lọc hoặc tìm kiếm với từ khóa khác
            </p>
            <button
              onClick={() => {
                setSelectedStatus('all');
                setSelectedCategory('Tất cả');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
            {filteredStories.map((story) => {
              const readingItem = readingList.find((p) => p.storySlug === story.slug);
              const lastChap = readingItem?.chapterNumber;
              const targetUrl = lastChap && lastChap > 0 ? `/truyen/${story.slug}/chuong/${lastChap}` : `/truyen/${story.slug}`;

              return (
                <Link
                  key={story.id}
                  href={targetUrl}
                  className="group flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl overflow-hidden hover:border-amber-400 dark:hover:border-amber-500 transition shadow-sm hover:shadow-md"
                >
                  {/* Bìa truyện chuẩn tỉ lệ sách 3:4 */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={story.coverUrl}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                    {/* Badge Trạng thái & Audio */}
                    <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                      {lastChap && lastChap > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-neutral-950 text-[10px] font-black shadow backdrop-blur-sm">
                          C.{lastChap}
                        </span>
                      ) : (story as any).isImported ? (
                        <span className={`px-1.5 py-0.5 rounded-md text-white text-[10px] font-bold shadow backdrop-blur-sm uppercase ${
                          (story as any).sourceType === 'maccanh'
                            ? 'bg-gradient-to-r from-amber-600 to-indigo-600'
                            : (story as any).sourceType === 'file_epub'
                            ? 'bg-blue-600'
                            : 'bg-amber-500'
                        }`}>
                          {(story as any).sourceType === 'maccanh' ? 'MẶC CẢNH' : (story as any).sourceType === 'file_epub' ? 'EPUB' : (story as any).sourceType === 'file_txt' ? 'TXT' : 'WEB'}
                        </span>
                      ) : story.status === 'Hoàn thành' ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold shadow backdrop-blur-sm">
                          Full
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-orange-500/90 text-white text-[10px] font-bold shadow backdrop-blur-sm">
                          Đang ra
                        </span>
                      )}
                    </div>

                    {/* Nút xóa truyện tự nhập */}
                    {(story as any).isImported && (
                      <button
                        onClick={(e) => handleDeleteImported(e, story.slug)}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white transition z-10 shadow"
                        title="Xóa truyện tự nhập khỏi thư viện"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-amber-400 text-[10px] font-bold flex items-center gap-0.5 backdrop-blur-sm">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      <span>{story.rating}</span>
                    </div>
                  </div>

                  {/* Thông tin truyện */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1">
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                        {story.title}
                      </h3>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                        {story.author}
                      </p>
                    </div>

                    <div className="pt-1.5 flex items-center justify-between text-[10px] text-neutral-400 border-t border-neutral-100 dark:border-neutral-800/80">
                      {lastChap && lastChap > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold truncate">
                          Đang đọc C.{lastChap}
                        </span>
                      ) : (
                        <span className="truncate max-w-[80px]">
                          {story.categories[0] || 'Tiên Hiệp'}
                        </span>
                      )}
                      <span className="shrink-0 font-medium">
                        {(story as any).chapters?.length || story.chaptersCount} chap
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. Thanh Điều Hướng Đáy Màn Hình Di Động (Native App Dock - 100% Mobile Friendly) */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden z-40 bg-white/95 dark:bg-[#070a12]/95 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 px-3 py-2 flex items-center justify-around shadow-2xl">
        <Link
          href="/"
          className="flex flex-col items-center gap-0.5 text-amber-600 dark:text-amber-400"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Khám phá</span>
        </Link>

        <button
          onClick={() => {
            setSelectedCategory('Sách Tự Nhập');
            window.scrollTo({ top: 300, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-0.5 ${selectedCategory === 'Sách Tự Nhập' ? 'text-amber-500 font-bold' : 'text-neutral-500 dark:text-neutral-400'}`}
        >
          <Library className="w-5 h-5" />
          <span className="text-[10px]">Tủ sách</span>
        </button>

        <button
          onClick={() => setIsImportModalOpen(true)}
          className="flex flex-col items-center gap-0.5 text-amber-500 active:scale-95 transition"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center -mt-3 shadow-md shadow-amber-500/30">
            <BookPlus className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Nhập Sách</span>
        </button>

        <Link
          href="/truyen/pham-nhan-tu-tien/chuong/1"
          className="flex flex-col items-center gap-0.5 text-neutral-500 dark:text-neutral-400 hover:text-amber-500"
        >
          <Headphones className="w-5 h-5" />
          <span className="text-[10px]">Nghe Audio</span>
        </Link>

        <button
          onClick={() => setIsPaymentOpen(true)}
          className="flex flex-col items-center gap-0.5 text-neutral-500 dark:text-neutral-400 hover:text-amber-500"
        >
          <Coins className="w-5 h-5" />
          <span className="text-[10px]">Nạp Xu</span>
        </button>
      </div>

      {/* Modal Nạp tiền VietQR */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
      />

      {/* Modal Nhập Sách Ngoài */}
      <ImportBookModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => loadImported()}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-neutral-400">Đang chuẩn bị kho kỳ thư...</div>}>
      <HomeContent />
    </Suspense>
  );
}
