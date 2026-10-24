'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Edit3,
  List,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  UploadCloud,
  X,
  Check,
  AlertCircle,
  ExternalLink,
  BookMarked,
  Filter,
  ArrowUpDown,
  FileText,
  Globe,
  Layers,
  Save,
  ChevronRight,
  Headphones
} from 'lucide-react';
import ImportBookModal from '@/components/ImportBookModal';
import {
  getAllImportedStories,
  getImportedStoryBySlug,
  saveImportedStory,
  deleteImportedStory,
  updateImportedStoryMetadata,
  deleteChapterFromImportedStory,
  updateChapterTitleInImportedStory,
  ImportedStory,
  ImportedStorySummary,
} from '@/lib/importedBookStorage';
import { getReadingProgress, getLastReadChapter } from '@/lib/storage';

export default function LibraryManagementPage() {
  const router = useRouter();

  // Danh sách sách & trạng thái tải
  const [stories, setStories] = useState<ImportedStorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<'all' | 'file_epub' | 'file_txt' | 'url_crawl' | 'maccanh'>('all');
  const [sortBy, setSortBy] = useState<'importedAt' | 'title' | 'chapters'>('importedAt');

  // Modal Thêm Sách
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Modal Sửa Thông Tin Sách
  const [editingStory, setEditingStory] = useState<ImportedStory | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    author: '',
    coverUrl: '',
    description: '',
    categoriesStr: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Modal Quản Lý Chương
  const [managingStory, setManagingStory] = useState<ImportedStory | null>(null);
  const [chapterSearch, setChapterSearch] = useState('');
  const [editingChapterNum, setEditingChapterNum] = useState<number | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState('');

  // Modal Xác Nhận Xóa
  const [deletingStory, setDeletingStory] = useState<ImportedStorySummary | null>(null);

  // Toast thông báo
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Nạp danh sách sách từ IndexedDB
  const refreshLibrary = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await getAllImportedStories();
      setStories(list);
    } catch (err) {
      console.warn('Lỗi đọc thư viện:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  // Lọc và sắp xếp danh sách sách
  const filteredStories = useMemo(() => {
    return stories
      .filter((s) => {
        if (selectedSource !== 'all' && s.sourceType !== selectedSource) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = s.title.toLowerCase().includes(q);
          const matchAuthor = s.author.toLowerCase().includes(q);
          const matchDesc = s.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchAuthor && !matchDesc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'importedAt') return b.importedAt - a.importedAt;
        if (sortBy === 'title') return a.title.localeCompare(b.title, 'vi');
        if (sortBy === 'chapters') return b.chaptersCount - a.chaptersCount;
        return 0;
      });
  }, [stories, selectedSource, searchQuery, sortBy]);

  // Tổng số chương trong toàn bộ thư viện
  const totalChaptersCount = useMemo(() => {
    return stories.reduce((acc, cur) => acc + (cur.chaptersCount || 0), 0);
  }, [stories]);

  // Mở modal sửa thông tin sách
  const handleOpenEdit = async (slug: string) => {
    const fullStory = await getImportedStoryBySlug(slug);
    if (!fullStory) {
      showToast('Không tìm thấy dữ liệu truyện để chỉnh sửa', 'error');
      return;
    }
    setEditingStory(fullStory);
    setEditForm({
      title: fullStory.title,
      author: fullStory.author,
      coverUrl: fullStory.coverUrl || '',
      description: fullStory.description || '',
      categoriesStr: (fullStory.categories || []).join(', '),
    });
  };

  // Lưu chỉnh sửa thông tin sách
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory) return;
    if (!editForm.title.trim()) {
      showToast('Tiêu đề sách không được để trống', 'error');
      return;
    }

    setIsSavingEdit(true);
    try {
      const categories = editForm.categoriesStr
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      await updateImportedStoryMetadata(editingStory.slug, {
        title: editForm.title.trim(),
        author: editForm.author.trim() || 'Khuyết Danh',
        coverUrl: editForm.coverUrl.trim() || undefined,
        description: editForm.description.trim(),
        categories: categories.length > 0 ? categories : ['Sách Tự Nhập'],
      });

      showToast(`Đã cập nhật thông tin "${editForm.title}" thành công!`, 'success');
      setEditingStory(null);
      await refreshLibrary();
    } catch (err: any) {
      showToast('Lỗi khi lưu thông tin: ' + err.message, 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Mở modal quản lý danh sách chương
  const handleOpenChapterManager = async (slug: string) => {
    const fullStory = await getImportedStoryBySlug(slug);
    if (!fullStory) {
      showToast('Không tìm thấy dữ liệu chương của truyện này', 'error');
      return;
    }
    setManagingStory(fullStory);
    setChapterSearch('');
    setEditingChapterNum(null);
  };

  // Xóa một chương cụ thể
  const handleDeleteChapter = async (chapNumber: number) => {
    if (!managingStory) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa Chương ${chapNumber} khỏi cuốn sách này?`)) return;

    const ok = await deleteChapterFromImportedStory(managingStory.slug, chapNumber);
    if (ok) {
      showToast(`Đã xóa Chương ${chapNumber}`, 'info');
      const updated = await getImportedStoryBySlug(managingStory.slug);
      setManagingStory(updated);
      await refreshLibrary();
    }
  };

  // Đổi tên tiêu đề chương
  const handleSaveChapterTitle = async (chapNumber: number) => {
    if (!managingStory || !editingChapterTitle.trim()) return;
    const ok = await updateChapterTitleInImportedStory(managingStory.slug, chapNumber, editingChapterTitle.trim());
    if (ok) {
      showToast(`Đã đổi tên Chương ${chapNumber}`, 'success');
      setEditingChapterNum(null);
      const updated = await getImportedStoryBySlug(managingStory.slug);
      setManagingStory(updated);
    }
  };

  // Xóa hoàn toàn một cuốn sách
  const handleConfirmDelete = async () => {
    if (!deletingStory) return;
    try {
      await deleteImportedStory(deletingStory.slug);
      showToast(`Đã xóa cuốn "${deletingStory.title}" khỏi thư viện`, 'info');
      setDeletingStory(null);
      await refreshLibrary();
    } catch (err: any) {
      showToast('Lỗi khi xóa sách: ' + err.message, 'error');
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'file_epub':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">EPUB</span>;
      case 'file_txt':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">TXT</span>;
      case 'maccanh':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">MẶC CẢNH</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">WEB</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f0e0] dark:bg-[#070a12] text-[#2d2218] dark:text-[#cbd5e1] pb-24">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 p-3.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-3 border ${
            toast.type === 'success'
              ? 'bg-emerald-500/90 text-white border-emerald-400'
              : toast.type === 'error'
              ? 'bg-rose-500/90 text-white border-rose-400'
              : 'bg-neutral-900/90 text-amber-300 border-neutral-700'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
          {toast.type === 'info' && <Trash2 className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Trang Quản Lý */}
      <div className="bg-[#efe5ce]/80 dark:bg-[#0f1422]/80 border-b border-[#dfd2b5] dark:border-neutral-800/80 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition"
              title="Về trang chủ"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <BookMarked className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                <span>Quản Lý Thư Viện Sách</span>
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Kệ sách cá nhân: Thêm mới, chỉnh sửa thông tin, xóa và quản lý chương
              </p>
            </div>
          </div>

          {/* Nút Thêm Sách Mới */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Thêm Sách Mới (EPUB / TXT / Web)</span>
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Thống kê nhanh 3 khối */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-[#efe5ce]/60 dark:bg-[#0f1422]/60 border border-[#dfd2b5] dark:border-neutral-800 rounded-2xl p-3.5 sm:p-4 text-center">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-neutral-500 tracking-wider block">
              Tổng Đầu Sách
            </span>
            <span className="text-xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
              {stories.length}
            </span>
          </div>
          <div className="bg-[#efe5ce]/60 dark:bg-[#0f1422]/60 border border-[#dfd2b5] dark:border-neutral-800 rounded-2xl p-3.5 sm:p-4 text-center">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-neutral-500 tracking-wider block">
              Tổng Số Chương
            </span>
            <span className="text-xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {totalChaptersCount}
            </span>
          </div>
          <div className="bg-[#efe5ce]/60 dark:bg-[#0f1422]/60 border border-[#dfd2b5] dark:border-neutral-800 rounded-2xl p-3.5 sm:p-4 text-center">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-neutral-500 tracking-wider block">
              Bộ Nhớ Đã Dùng
            </span>
            <span className="text-xl sm:text-3xl font-black text-neutral-800 dark:text-neutral-200 mt-1 block">
              ~{(totalChaptersCount * 0.02).toFixed(1)} MB
            </span>
          </div>
        </div>

        {/* Thanh Công Cụ Tìm Kiếm & Bộ Lọc */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#efe5ce]/40 dark:bg-[#0f1422]/40 p-3 rounded-2xl border border-[#dfd2b5] dark:border-neutral-800/80">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên sách, tác giả..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Bộ lọc định dạng & Sắp xếp */}
          <div className="flex items-center gap-2">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as any)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">Tất cả định dạng</option>
              <option value="file_epub">File EPUB</option>
              <option value="file_txt">File TXT</option>
              <option value="url_crawl">Web Crawl</option>
              <option value="maccanh">Mặc Cảnh Studio</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="importedAt">Mới nhập gần đây</option>
              <option value="title">Tên sách (A-Z)</option>
              <option value="chapters">Nhiều chương nhất</option>
            </select>
          </div>
        </div>

        {/* Danh sách Sách Trong Thư Viện */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent"></div>
            <p className="text-xs font-bold text-neutral-500">Đang nạp dữ liệu thư viện...</p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="py-16 text-center space-y-4 bg-[#efe5ce]/30 dark:bg-[#0f1422]/30 rounded-3xl border border-dashed border-[#dfd2b5] dark:border-neutral-800 p-8">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                {searchQuery ? 'Không tìm thấy cuốn sách nào phù hợp' : 'Thư viện của bạn đang trống'}
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'Hãy thử tìm bằng từ khóa khác hoặc xóa bộ lọc định dạng.'
                  : 'Hãy thêm cuốn sách đầu tiên bằng cách tải lên file EPUB, file TXT hoặc nhập link truyện.'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm sách ngay bây giờ</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStories.map((story) => {
              const lastChap = getLastReadChapter(story.slug) || story.lastReadChapter || 1;

              return (
                <div
                  key={story.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3 relative group"
                >
                  {/* Phần trên: Ảnh bìa + Thông tin chính */}
                  <div className="flex gap-3.5">
                    {/* Bìa sách */}
                    <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 shadow relative border border-black/5 dark:border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={story.coverUrl || '/covers/default.png'}
                        alt={story.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as any).src = '/covers/default.png';
                        }}
                      />
                      <div className="absolute top-1 left-1">
                        {getSourceBadge(story.sourceType)}
                      </div>
                    </div>

                    {/* Chi tiết */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="font-black text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug">
                          {story.title}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5 font-medium">
                          {story.author || 'Khuyết Danh'}
                        </p>
                      </div>

                      <div className="space-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                          <Layers className="w-3.5 h-3.5" />
                          <span>{story.chaptersCount} chương</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                          <Clock className="w-3 h-3" />
                          <span>Đang đọc: Chương {lastChap}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mô tả ngắn */}
                  {story.description && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 italic leading-relaxed">
                      &quot;{story.description}&quot;
                    </p>
                  )}

                  {/* CỤM 4 NÚT HÀNH ĐỘNG TOÀN DIỆN (Đọc, Sửa, Quản lý chương, Xóa) */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 grid grid-cols-4 gap-1.5">
                    {/* 1. Nút Đọc sách */}
                    <Link
                      href={`/truyen/${story.slug}/chuong/${lastChap}`}
                      className="py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center justify-center gap-1 shadow-sm transition active:scale-95"
                      title="Đọc tiếp ngay"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Đọc</span>
                    </Link>

                    {/* 2. Nút Sửa thông tin */}
                    <button
                      onClick={() => handleOpenEdit(story.slug)}
                      className="py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                      title="Chỉnh sửa tên sách, tác giả, ảnh bìa..."
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Sửa</span>
                    </button>

                    {/* 3. Nút Quản lý chương */}
                    <button
                      onClick={() => handleOpenChapterManager(story.slug)}
                      className="py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                      title="Xem và quản lý các chương"
                    >
                      <List className="w-3.5 h-3.5 text-amber-500" />
                      <span>Chương</span>
                    </button>

                    {/* 4. Nút Xóa sách */}
                    <button
                      onClick={() => setDeletingStory(story)}
                      className="py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-500 text-rose-600 hover:text-white font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer border border-rose-200 dark:border-rose-900/40"
                      title="Xóa cuốn này khỏi thư viện"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal 1: Sửa Thông Tin Sách (Edit Book Metadata) */}
      {editingStory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl text-neutral-900 dark:text-white relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-blue-500/20 text-blue-500 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black">Sửa Thông Tin Tác Phẩm</h3>
                  <p className="text-[10px] text-neutral-500">Cập nhật tiêu đề, tác giả, ảnh bìa và giới thiệu</p>
                </div>
              </div>
              <button
                onClick={() => setEditingStory(null)}
                className="w-8 h-8 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold block mb-1 text-neutral-700 dark:text-neutral-300">
                  Tên Sách / Tác Phẩm *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-neutral-700 dark:text-neutral-300">
                  Tên Tác Giả
                </label>
                <input
                  type="text"
                  value={editForm.author}
                  onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-neutral-700 dark:text-neutral-300">
                  Đường Dẫn Ảnh Bìa (Cover URL)
                </label>
                <input
                  type="text"
                  value={editForm.coverUrl}
                  onChange={(e) => setEditForm({ ...editForm, coverUrl: e.target.value })}
                  placeholder="https://... hoặc /covers/default.png"
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-neutral-700 dark:text-neutral-300">
                  Thể Loại (Cách nhau bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={editForm.categoriesStr}
                  onChange={(e) => setEditForm({ ...editForm, categoriesStr: e.target.value })}
                  placeholder="Khoa học, Hồi ký, Tiểu thuyết..."
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-neutral-700 dark:text-neutral-300">
                  Mô Tả / Giới Thiệu Tóm Tắt
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStory(null)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold hover:bg-neutral-200"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingEdit ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Quản Lý Danh Sách Chương (Chapter Management Drawer) */}
      {managingStory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl text-neutral-900 dark:text-white relative flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header Drawer */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                  <List className="w-5 h-5" />
                </div>
                <div className="truncate mr-2">
                  <h3 className="text-sm font-black truncate">{managingStory.title}</h3>
                  <p className="text-[10px] text-neutral-500">
                    Danh sách {managingStory.chapters?.length || 0} chương • Sửa tên hoặc xóa chương
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManagingStory(null)}
                className="w-8 h-8 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-white shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tìm kiếm chương */}
            <div className="mb-3 shrink-0">
              <input
                type="text"
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
                placeholder="Tìm chương theo số hoặc tiêu đề..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
              />
            </div>

            {/* Danh sách chương cuộn */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {(managingStory.chapters || [])
                .filter((c) => {
                  if (!chapterSearch.trim()) return true;
                  const q = chapterSearch.toLowerCase().trim();
                  return c.title.toLowerCase().includes(q) || String(c.number).includes(q);
                })
                .map((chap) => {
                  const isEditingThis = editingChapterNum === chap.number;

                  return (
                    <div
                      key={chap.id}
                      className="p-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between gap-2 hover:border-amber-400 transition"
                    >
                      {isEditingThis ? (
                        <div className="flex-1 flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingChapterTitle}
                            onChange={(e) => setEditingChapterTitle(e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-amber-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveChapterTitle(chap.number)}
                            className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                            title="Lưu tên chương"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingChapterNum(null)}
                            className="p-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                            title="Hủy"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200 block truncate">
                              {chap.title}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              Chương {chap.number} • ~{chap.wordCount || Math.round((chap.content?.length || 0) / 5)} chữ
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Link
                              href={`/truyen/${managingStory.slug}/chuong/${chap.number}`}
                              className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition"
                              title="Mở đọc chương này"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => {
                                setEditingChapterNum(chap.number);
                                setEditingChapterTitle(chap.title);
                              }}
                              className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 transition"
                              title="Sửa tiêu đề chương"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteChapter(chap.number)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-600 transition"
                              title="Xóa chương này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Footer Drawer */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 mt-3 flex justify-end shrink-0">
              <button
                onClick={() => setManagingStory(null)}
                className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Xác Nhận Xóa Sách */}
      {deletingStory && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-neutral-900 dark:text-white">
                Xóa Sách Khỏi Thư Viện?
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Bạn có chắc chắn muốn xóa cuốn <strong className="text-neutral-800 dark:text-neutral-200">&quot;{deletingStory.title}&quot;</strong>? Toàn bộ {deletingStory.chaptersCount} chương và tiến trình đọc sẽ bị xóa vĩnh viễn khỏi thiết bị.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setDeletingStory(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/30 transition active:scale-95"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Thêm Sách Mới (ImportBookModal) */}
      <ImportBookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          showToast('Đã thêm sách mới vào thư viện thành công!', 'success');
          refreshLibrary();
        }}
      />
    </div>
  );
}
