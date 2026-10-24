'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Globe,
  FileText,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  ArrowRight,
  BookPlus,
} from 'lucide-react';
import { parseTxtFile, parseEpubFile } from '@/lib/bookFileParser';
import { saveImportedStory, ImportedStory } from '@/lib/importedBookStorage';
import { useRouter } from 'next/navigation';

interface ImportBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (story: ImportedStory) => void;
}

export default function ImportBookModal({ isOpen, onClose, onSuccess }: ImportBookModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');

  // File state
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsedStory, setParsedStory] = useState<ImportedStory | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // URL state
  const [inputUrl, setInputUrl] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlStory, setUrlStory] = useState<ImportedStory | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Editable fields
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');

  if (!isOpen) return null;

  // Xử lý khi chọn file
  const handleFile = async (file: File) => {
    setFileError(null);
    setParsedStory(null);

    const name = file.name.toLowerCase();
    if (!name.endsWith('.txt') && !name.endsWith('.epub')) {
      setFileError('Chỉ hỗ trợ tệp tin định dạng .txt hoặc .epub');
      return;
    }

    setIsParsingFile(true);
    try {
      let story: ImportedStory;
      if (name.endsWith('.epub')) {
        story = await parseEpubFile(file);
      } else {
        story = await parseTxtFile(file);
      }

      setParsedStory(story);
      setEditTitle(story.title);
      setEditAuthor(story.author);
    } catch (err: any) {
      console.error('Lỗi phân tích file:', err);
      setFileError(err.message || 'Không thể giải mã nội dung tệp tin này.');
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Lưu truyện từ tệp vào thư viện
  const handleSaveFileStory = async () => {
    if (!parsedStory) return;
    const finalStory: ImportedStory = {
      ...parsedStory,
      title: editTitle.trim() || parsedStory.title,
      author: editAuthor.trim() || parsedStory.author,
    };

    await saveImportedStory(finalStory);
    if (onSuccess) onSuccess(finalStory);
    onClose();
    router.push(`/truyen/${finalStory.slug}`);
  };

  // Phân tích liên kết URL
  const handleAnalyzeUrl = async () => {
    if (!inputUrl.trim() || !inputUrl.startsWith('http')) {
      setUrlError('Vui lòng nhập đường link hợp lệ bắt đầu bằng http:// hoặc https://');
      return;
    }

    setUrlError(null);
    setUrlStory(null);
    setIsFetchingUrl(true);

    try {
      const res = await fetch('/api/import/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể cào thông tin từ trang web này');
      }

      setUrlStory(data.story);
      setEditTitle(data.story.title);
      setEditAuthor(data.story.author);
    } catch (err: any) {
      setUrlError(err.message || 'Lỗi kết nối khi phân tích đường dẫn truyện');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // Lưu truyện từ URL vào thư viện
  const handleSaveUrlStory = async () => {
    if (!urlStory) return;
    const finalStory: ImportedStory = {
      ...urlStory,
      title: editTitle.trim() || urlStory.title,
      author: editAuthor.trim() || urlStory.author,
    };

    await saveImportedStory(finalStory);
    if (onSuccess) onSuccess(finalStory);
    onClose();
    router.push(`/truyen/${finalStory.slug}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/40">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <BookPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Thêm Sách Vào Thư Viện
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Nhập từ tệp TXT, EPUB hoặc dán liên kết web
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="p-3 bg-neutral-100/70 dark:bg-neutral-800/60 border-b border-neutral-200/50 dark:border-neutral-800 flex gap-2">
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
              activeTab === 'file'
                ? 'bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tải Tệp Tin (.txt, .epub)</span>
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
              activeTab === 'url'
                ? 'bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Dán Link Truyện Web</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'file' ? (
            /* TAB 1: FILE IMPORT */
            <div className="space-y-4">
              {!parsedStory ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-amber-500 bg-amber-500/5 scale-[1.01]'
                      : 'border-neutral-300 dark:border-neutral-700 hover:border-amber-500/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.epub"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFile(e.target.files[0]);
                      }
                    }}
                  />

                  {isParsingFile ? (
                    <div className="py-6 space-y-3">
                      <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                      <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                        Đang phân tích cấu trúc chương truyện...
                      </p>
                      <p className="text-xs text-neutral-500">
                        Tự động chia chương, trích xuất bìa sách và metadata.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center shadow-inner">
                        <UploadCloud className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                          Kéo thả tệp tin vào đây hoặc <span className="text-amber-600 dark:text-amber-400 underline">chọn tệp</span>
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Hỗ trợ định dạng <b>.TXT</b> (tự nhận diện Chương) và <b>.EPUB</b> (sách điện tử)
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Lưu ngoại tuyến trong máy, đọc mượt 100% không cần mạng</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* PREVIEW FILE STORY */
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/80 flex gap-3.5">
                    {parsedStory.coverUrl ? (
                      <img
                        src={parsedStory.coverUrl}
                        alt="Bìa sách"
                        className="w-20 h-28 object-cover rounded-xl shadow-md border border-neutral-200 dark:border-neutral-700 shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-28 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl flex flex-col items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-sm">
                        <BookOpen className="w-7 h-7 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {parsedStory.sourceType === 'file_epub' ? 'EPUB' : 'TXT'}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Tên Truyện
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Tác Giả
                        </label>
                        <input
                          type="text"
                          value={editAuthor}
                          onChange={(e) => setEditAuthor(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{parsedStory.chaptersCount} chương</span>
                        </span>
                        <button
                          onClick={() => setParsedStory(null)}
                          className="text-[11px] text-neutral-500 hover:text-red-500 transition underline ml-auto"
                        >
                          Chọn tệp khác
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preview danh sách chương */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                      Xem trước các chương đầu:
                    </p>
                    <div className="max-h-36 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800 p-2 divide-y divide-neutral-100 dark:divide-neutral-800 text-xs text-neutral-700 dark:text-neutral-300">
                      {parsedStory.chapters.slice(0, 5).map((c) => (
                        <div key={c.id} className="py-1 px-1 flex items-center justify-between">
                          <span className="truncate pr-2 font-medium">{c.title}</span>
                          <span className="text-[10px] text-neutral-400 shrink-0">{c.wordCount} chữ</span>
                        </div>
                      ))}
                      {parsedStory.chaptersCount > 5 && (
                        <div className="py-1 px-1 text-[11px] text-neutral-400 italic">
                          ...và {parsedStory.chaptersCount - 5} chương tiếp theo
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveFileStory}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-amber-500/25 hover:brightness-105 active:scale-[0.99] transition flex items-center justify-center gap-2"
                  >
                    <span>Lưu Vào Thư Viện & Đọc Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {fileError && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{fileError}</span>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: URL CRAWL IMPORT */
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Nhập đường link truyện trực tuyến
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://truyenfull.io/ten-truyen... hoặc link truyện khác"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAnalyzeUrl();
                    }}
                    className="flex-1 px-3.5 py-2.5 rounded-2xl text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                  <button
                    onClick={handleAnalyzeUrl}
                    disabled={isFetchingUrl || !inputUrl.trim()}
                    className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs transition shrink-0 flex items-center gap-1.5"
                  >
                    {isFetchingUrl ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang cào...</span>
                      </>
                    ) : (
                      <span>Phân Tích</span>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Hệ thống tự động bóc tách tên truyện, tác giả, ảnh bìa và danh sách chương.
                </p>
              </div>

              {urlStory && (
                <div className="space-y-4 animate-in fade-in duration-200 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/80 flex gap-3.5">
                    {urlStory.coverUrl ? (
                      <img
                        src={urlStory.coverUrl}
                        alt="Bìa truyện"
                        className="w-20 h-28 object-cover rounded-xl shadow-md border border-neutral-200 dark:border-neutral-700 shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-28 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <BookOpen className="w-7 h-7" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Tên Truyện
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Tác Giả
                        </label>
                        <input
                          type="text"
                          value={editAuthor}
                          onChange={(e) => setEditAuthor(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tìm thấy {urlStory.chaptersCount} chương</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {urlStory.description && (
                    <div className="p-3 rounded-xl bg-neutral-100/60 dark:bg-neutral-800/40 text-xs text-neutral-600 dark:text-neutral-300 line-clamp-3">
                      {urlStory.description}
                    </div>
                  )}

                  <button
                    onClick={handleSaveUrlStory}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-amber-500/25 hover:brightness-105 active:scale-[0.99] transition flex items-center justify-center gap-2"
                  >
                    <span>Thêm Vào Thư Viện & Bắt Đầu Đọc</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {urlError && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{urlError}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
