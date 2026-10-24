'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mic,
  Play,
  Pause,
  Check,
  Download,
  Star,
  Sparkles,
  Volume2,
  Filter,
  Search,
  BookOpen,
  ArrowRight,
  Radio,
  Layers,
  ArrowLeft,
  Plus,
  Trash2
} from 'lucide-react';
import { LAZIBOOK_NANO_VOICES, MICROX_STUDIO_VOICES, StudioVoice } from '@/data/voices';
import { getStoredSettings, saveStoredSettings } from '@/lib/storage';
import VoiceCloningModal, { CustomClonedVoice } from '@/components/VoiceCloningModal';

export default function PhongThuPage() {
  const router = useRouter();
  const [engineTab, setEngineTab] = useState<'vieneu' | 'microx' | 'all'>('vieneu');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('namminh');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterStyle, setFilterStyle] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Giọng Clone Tự Tạo Của Người Dùng (LaziBook Style)
  const [customVoices, setCustomVoices] = useState<CustomClonedVoice[]>([]);
  const [isCreateVoiceOpen, setIsCreateVoiceOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Audio sample playback state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const stored = getStoredSettings();
      if (stored && (stored as any).voice) {
        setSelectedVoiceId((stored as any).voice);
      }
      const savedCustom = localStorage.getItem('bientruyen_custom_voices');
      if (savedCustom) {
        setCustomVoices(JSON.parse(savedCustom));
      }
    } catch (e) {}
  }, []);

  const handleSelectCustomVoice = (voice: CustomClonedVoice) => {
    setSelectedVoiceId(voice.id);
    try {
      const current = getStoredSettings();
      const updated = { ...current, voice: voice.id };
      saveStoredSettings(updated as any);
      localStorage.setItem('bientruyen_default_voice', voice.id);
      localStorage.setItem('bientruyen_tts_voice', voice.id);
      localStorage.setItem('bientruyen_tts_voice_name', voice.name);
      setToastMsg(`Đã chọn giọng "${voice.name}" làm giọng đọc mặc định!`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (e) {}
  };

  const handleDeleteCustomVoice = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customVoices.filter((v) => v.id !== id);
    setCustomVoices(updated);
    try {
      localStorage.setItem('bientruyen_custom_voices', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleVoiceCreated = (newVoice: CustomClonedVoice) => {
    setCustomVoices((prev) => [newVoice, ...prev.filter((v) => v.id !== newVoice.id)]);
    handleSelectCustomVoice(newVoice);
    setToastMsg(`🎉 Đã tạo thành công giọng "${newVoice.name}"!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSelectVoice = (voice: StudioVoice) => {
    setSelectedVoiceId(voice.id);
    try {
      const current = getStoredSettings();
      const updated = { ...current, voice: voice.id };
      saveStoredSettings(updated as any);
      localStorage.setItem('bientruyen_default_voice', voice.id);
      localStorage.setItem('bientruyen_tts_voice', voice.id);
      localStorage.setItem('bientruyen_tts_voice_name', voice.name);
    } catch (e) {}
  };

  const handlePlaySample = (voice: StudioVoice | any, overrideVoiceId?: string) => {
    const activeVoiceId = overrideVoiceId || voice.id;
    setPlaybackError(null);
    if (playingVoiceId === activeVoiceId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setPlayingVoiceId(null);
      setIsLoadingAudio(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    setIsLoadingAudio(true);
    setPlayingVoiceId(activeVoiceId);

    const encodedText = encodeURIComponent(voice.sampleText);
    const gender = voice.gender ? `&gender=${encodeURIComponent(voice.gender)}` : '';
    const pitch = (voice as any).edgePitch ? `&pitch=${encodeURIComponent((voice as any).edgePitch)}` : '';
    const rate = (voice as any).edgeRate ? `&rate=${encodeURIComponent((voice as any).edgeRate)}` : '';
    const audioUrl = `/api/tts?voice=${encodeURIComponent(voice.id)}&text=${encodedText}&speed=1.0${gender}${pitch}${rate}`;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    // Phát âm thanh trực tiếp trong luồng Click của người dùng để tránh bị trình duyệt chặn Autoplay Policy
    audio.play().then(() => {
      setIsLoadingAudio(false);
    }).catch((err) => {
      console.warn('Playback deferred, waiting for canplay:', err);
      audio.oncanplay = () => {
        audio.play().then(() => setIsLoadingAudio(false)).catch((e) => {
          console.warn('Autoplay prevented:', e);
          setIsLoadingAudio(false);
          setPlayingVoiceId(null);
          setPlaybackError('Trình duyệt yêu cầu bấm lại để phát âm thanh.');
        });
      };
    });

    audio.onplaying = () => {
      setIsLoadingAudio(false);
      setPlaybackError(null);
    };

    audio.onended = () => {
      setPlayingVoiceId(null);
      setIsLoadingAudio(false);
    };

    audio.onerror = (e) => {
      console.error('Audio load error:', e);
      setIsLoadingAudio(false);
      setPlayingVoiceId(null);
      setPlaybackError(`Không thể phát giọng "${voice.name}". Dịch vụ VieNeu AI (cổng 8005) chưa sẵn sàng hoặc model chưa nạp xong.`);
    };
  };

  const handleDownloadSample = (voice: StudioVoice) => {
    const encodedText = encodeURIComponent(voice.sampleText);
    const audioUrl = `/api/tts?voice=${encodeURIComponent(voice.id)}&text=${encodedText}&speed=1.0`;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `Mau_Giong_${voice.name.replace(/\s+/g, '_')}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Chọn danh sách giọng theo Tab Engine
  const baseVoices =
    engineTab === 'vieneu'
      ? LAZIBOOK_NANO_VOICES
      : engineTab === 'microx'
      ? MICROX_STUDIO_VOICES
      : [...LAZIBOOK_NANO_VOICES, ...MICROX_STUDIO_VOICES];

  // Lọc giọng theo tiêu chí
  const filteredVoices = baseVoices.filter((voice) => {
    if (filterRegion !== 'all' && voice.region !== filterRegion) return false;
    if (filterGender !== 'all' && voice.gender !== filterGender) return false;
    if (filterStyle !== 'all' && voice.style !== filterStyle) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = voice.name.toLowerCase().includes(q);
      const matchTag = voice.tagline.toLowerCase().includes(q);
      const matchRegion = voice.regionLabel.toLowerCase().includes(q);
      const matchStyle = voice.styleLabel.toLowerCase().includes(q);
      if (!matchName && !matchTag && !matchRegion && !matchStyle) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0d14] text-neutral-900 dark:text-neutral-100 transition-colors">
      
      {/* 1. Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#0a0d14]/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition border border-transparent hover:border-current/10"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 text-white">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-black text-base sm:text-lg flex items-center gap-2">
                  <span>Phòng Thu Giọng Đọc</span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    AI STUDIO
                  </span>
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateVoiceOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-amber-500/25 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo giọng</span>
            </button>
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              <span>Vào Đọc Truyện</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28">

        {playbackError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm">
            <span>⚠️ {playbackError}</span>
            <button
              onClick={() => setPlaybackError(null)}
              className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 font-bold text-xs transition"
            >
              Đóng
            </button>
          </div>
        )}
        
        {/* Bộ chuyển đổi Engine: 5 Giọng VITS ONNX & Neural Gốc vs 6 Giọng MicroX Clone vs Tất Cả */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 bg-neutral-200/60 dark:bg-neutral-900 rounded-3xl border border-neutral-300 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setEngineTab('vieneu')}
            className={`py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              engineTab === 'vieneu'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.01]'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Volume2 className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <div className="font-black">🎙️ Giọng VITS ONNX & Neural Gốc</div>
              <div className="text-[10px] opacity-80 font-normal">Mô hình VITS thật + Microsoft chuẩn</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setEngineTab('microx')}
            className={`py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              engineTab === 'microx'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 scale-[1.01]'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <div className="font-black">🌟 6 Giọng AI Clone (MicroX)</div>
              <div className="text-[10px] opacity-80 font-normal">Ngọc Ngạn, Vincente, Thúy Tiên...</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setEngineTab('all')}
            className={`py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              engineTab === 'all'
                ? 'bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 shadow-md scale-[1.01]'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <div className="font-black">✨ Xem Tất Cả (11 Giọng Thật)</div>
              <div className="text-[10px] opacity-80 font-normal">Toàn bộ kho giọng thực 100%</div>
            </div>
          </button>
        </div>

        {/* Banner Thông Tin Giọng */}
        <div className={`p-5 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden text-white transition-all ${
          engineTab === 'microx'
            ? 'bg-gradient-to-r from-neutral-900 via-stone-900 to-amber-950'
            : engineTab === 'all'
            ? 'bg-gradient-to-r from-neutral-900 via-zinc-900 to-neutral-800'
            : 'bg-gradient-to-r from-neutral-900 via-slate-900 to-indigo-950'
        }`}>
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                engineTab === 'microx'
                  ? 'bg-amber-400 text-black'
                  : engineTab === 'all'
                  ? 'bg-emerald-400 text-black'
                  : 'bg-indigo-400 text-black'
              }`}>
                {engineTab === 'microx' ? 'MICROX VOICE CLONING' : engineTab === 'all' ? 'TỔNG HỢP 11 GIỌNG' : 'VITS ONNX ENGINE'}
              </span>
              <span className="text-xs opacity-80">
                {engineTab === 'microx' ? 'Đã kích hoạt API Key bản quyền' : 'Mô hình VITS ONNX chạy trực tiếp VPS'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              {engineTab === 'microx'
                ? 'Tuyển Tập 6 Giọng Độc Bản Từng Vùng Miền'
                : engineTab === 'all'
                ? 'Toàn Bộ 11 Giọng Đọc Thật (VITS + MicroX + Microsoft)'
                : 'Kho Giọng VITS ONNX & Microsoft Neural'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {engineTab === 'microx'
                ? 'Mỗi giọng đọc là một nhân vật riêng biệt với âm sắc và phương ngữ chân thực: Nguyễn Ngọc Ngạn (trầm ma mị), Vincente Toàn (Sài Gòn hào sảng), Thúy Tiên (miền Tây mộc mạc), Quang Toàn (miền Trung kiên nghị).'
                : engineTab === 'all'
                ? 'Tổng hợp đầy đủ các giọng đọc VITS ONNX cục bộ, Microsoft Neural gốc cùng 6 giọng AI Clone độc bản, không bóp méo âm sắc.'
                : 'Các giọng đọc chuẩn VITS ONNX (VAIS-1000, 25Hours Single, VIVOS) và giọng gốc của Microsoft (Nam Minh, Hoài My), đảm bảo âm thanh chân thực 100%.'}
            </p>
          </div>
          <div className="absolute right-4 -bottom-6 opacity-10 sm:opacity-20 pointer-events-none">
            <Volume2 className="w-56 h-56 text-amber-400" />
          </div>
        </div>

        {/* 3. Filter & Search Controls */}
        <div className="bg-white dark:bg-[#0f1422] p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Vùng miền */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-neutral-500 dark:text-neutral-400 font-bold mr-1">Vùng miền:</span>
              {[
                { id: 'all', label: `Tất cả (${baseVoices.length})` },
                { id: 'bac', label: 'Miền Bắc' },
                { id: 'trung', label: 'Miền Trung' },
                { id: 'nam', label: 'Miền Nam' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setFilterRegion(r.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition border cursor-pointer ${
                    filterRegion === r.id
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Giới tính */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-500 dark:text-neutral-400 font-bold mr-1">Giới tính:</span>
              {[
                { id: 'all', label: 'Cả hai' },
                { id: 'male', label: 'Nam' },
                { id: 'female', label: 'Nữ' },
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => setFilterGender(g.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition border cursor-pointer ${
                    filterGender === g.id
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
            {/* Phong cách */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-neutral-500 dark:text-neutral-400 font-bold mr-1">Phong cách:</span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'ke-chuyen', label: 'Kể chuyện' },
                { id: 'doc-truyen', label: 'Đọc truyện' },
                { id: 'tin-tuc', label: 'Tin tức' },
                { id: 'tu-nhien', label: 'Tự nhiên' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setFilterStyle(s.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    filterStyle === s.id
                      ? 'bg-black/10 dark:bg-white/10 text-amber-600 dark:text-amber-400'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Ô tìm kiếm */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm giọng đọc..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Toast thông báo */}
        {toastMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in fade-in">
            <span>{toastMsg}</span>
            <button
              onClick={() => setToastMsg(null)}
              className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* KHỐI: GIỌNG CỦA BẠN (CUSTOM CLONED VOICES - LAZIBOOK STYLE) */}
        {customVoices.length > 0 && (
          <div className="space-y-3 p-4 rounded-3xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-black flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>GIỌNG CỦA BẠN ({customVoices.length})</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  CLONED
                </span>
              </h2>
              <button
                onClick={() => setIsCreateVoiceOpen(true)}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo thêm giọng</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customVoices.map((cVoice) => {
                const isSelected = selectedVoiceId === cVoice.id;
                const isPlaying = playingVoiceId === cVoice.id;

                return (
                  <div
                    key={cVoice.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 relative group flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                        : 'bg-white dark:bg-[#0f1422] border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                            {cVoice.name.slice(0, 2).toUpperCase()}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                                {cVoice.name}
                              </h3>
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                CỦA BẠN
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                              <span>{cVoice.gender === 'male' ? 'Nam' : 'Nữ'}</span>
                              <span>•</span>
                              <span>{cVoice.region}</span>
                              <span>•</span>
                              <span className="capitalize">{cVoice.style || 'Tự nhiên'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Nút xóa giọng */}
                        <button
                          onClick={(e) => handleDeleteCustomVoice(cVoice.id, e)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition opacity-80 hover:opacity-100"
                          title="Xóa giọng này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Thông tin model */}
                      <div className="mt-3 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                        <span>Model: <strong className="uppercase">{cVoice.model}</strong></span>
                        <span>Khử ồn: <strong>{cVoice.noiseReduction ? 'Bật' : 'Tắt'}</strong></span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                      {/* Nút nghe thử: Hỗ trợ cả Thử AI Đọc và Mẫu gốc */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const cloneVoice = {
                              id: cVoice.id,
                              name: cVoice.name,
                              gender: cVoice.gender || 'male',
                              sampleText: `Chào bạn, tôi là giọng đọc ${cVoice.gender === 'female' ? 'nữ' : 'nam'} ${cVoice.name} được nhân bản bằng trí tuệ nhân tạo của bạn.`,
                            };
                            handlePlaySample(cloneVoice as any, `${cVoice.id}_tts`);
                          }}
                          className="py-1.5 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          title="Nghe AI đọc truyện bằng chất giọng này"
                        >
                          {playingVoiceId === `${cVoice.id}_tts` ? (
                            <Pause className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <Play className="w-3.5 h-3.5 text-amber-600 fill-current" />
                          )}
                          <span>{playingVoiceId === `${cVoice.id}_tts` ? 'Dừng' : 'Thử AI đọc'}</span>
                        </button>

                        {cVoice.sampleAudioUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              if (playingVoiceId === `${cVoice.id}_orig`) {
                                if (audioRef.current) {
                                  audioRef.current.pause();
                                  audioRef.current.src = '';
                                }
                                setPlayingVoiceId(null);
                                return;
                              }
                              if (audioRef.current) {
                                audioRef.current.pause();
                                audioRef.current.src = '';
                              }
                              const a = new Audio(cVoice.sampleAudioUrl);
                              audioRef.current = a;
                              a.onended = () => setPlayingVoiceId(null);
                              a.onerror = () => setPlayingVoiceId(null);
                              a.play().catch(() => setPlayingVoiceId(null));
                              setPlayingVoiceId(`${cVoice.id}_orig`);
                            }}
                            className="py-1.5 px-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Nghe lại đoạn ghi âm mẫu 5-8s ban đầu"
                          >
                            {playingVoiceId === `${cVoice.id}_orig` ? (
                              <Pause className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                            <span>{playingVoiceId === `${cVoice.id}_orig` ? 'Dừng' : 'Mẫu gốc'}</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectCustomVoice(cVoice)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-500/10 hover:text-amber-500 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                        <span>{isSelected ? 'Đang chọn' : 'Chọn đọc'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Voice Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVoices.map((voice) => {
            const isSelected = selectedVoiceId === voice.id || selectedVoiceId === `mx_${voice.id}`;
            const isPlaying = playingVoiceId === voice.id;

            return (
              <div
                key={voice.id}
                className={`p-4 rounded-2xl border transition-all duration-200 relative group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-white dark:bg-[#0f1422] border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm'
                }`}
              >
                <div>
                  {/* Hàng 1: Avatar, Tên, Huy hiệu Neural, Action buttons */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      {/* Avatar bo tròn 2 ký tự viết tắt */}
                      <div className={`w-11 h-11 rounded-2xl ${voice.avatarBg} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md`}>
                        {voice.code}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                            {voice.name}
                          </h3>
                          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                            engineTab === 'microx'
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                          }`}>
                            {engineTab === 'microx' ? 'CLONE AI' : 'NANO'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {voice.gender === 'male' ? 'Nam' : 'Nữ'} • {voice.regionLabel} • {voice.styleLabel}
                        </p>
                      </div>
                    </div>

                    {/* Cụm 3 nút hành động: Chọn, Tải, Nghe thử */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Nút Chọn giọng */}
                      <button
                        type="button"
                        onClick={() => handleSelectVoice(voice)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100 border border-current/10'
                        }`}
                        title={isSelected ? 'Đang chọn làm giọng mặc định' : 'Chọn làm giọng đọc chính'}
                      >
                        <Check className="w-4 h-4" />
                      </button>

                      {/* Nút Tải mẫu audio */}
                      <button
                        type="button"
                        onClick={() => handleDownloadSample(voice)}
                        className="w-8 h-8 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition opacity-70 hover:opacity-100 border border-current/10 cursor-pointer"
                        title="Tải đoạn âm thanh mẫu"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Nút Nghe thử */}
                      <button
                        type="button"
                        onClick={() => handlePlaySample(voice)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${
                          isPlaying
                            ? 'bg-amber-500 text-white shadow-md animate-pulse'
                            : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 text-neutral-700 dark:text-neutral-300'
                        }`}
                        title={isPlaying ? 'Dừng phát' : 'Nghe thử mẫu giọng'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Tagline giới thiệu đặc trưng giọng */}
                  <p className="mt-2.5 text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                    {voice.tagline}
                  </p>

                  {/* Đoạn văn bản mẫu đọc thử */}
                  <div className="mt-2.5 p-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-800/50">
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic line-clamp-2">
                      &quot;{voice.sampleText}&quot;
                    </p>
                  </div>
                </div>

                {/* Hàng cuối: Thông số đánh giá & Trạng thái kích hoạt */}
                <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1 text-amber-500">
                    {Array.from({ length: voice.stars }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>

                  {isSelected ? (
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Đang kích hoạt</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectVoice(voice)}
                      className="text-[11px] font-bold text-neutral-500 hover:text-amber-500 transition cursor-pointer"
                    >
                      Dùng giọng này
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trạng thái trống khi lọc không có kết quả */}
        {filteredVoices.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <Radio className="w-12 h-12 text-neutral-400 mx-auto opacity-50" />
            <h3 className="font-bold text-sm">Không tìm thấy giọng đọc phù hợp</h3>
            <p className="text-xs text-neutral-500">Vui lòng thử điều chỉnh lại bộ lọc vùng miền hoặc từ khóa tìm kiếm.</p>
          </div>
        )}
      </main>

      {/* 5. Fixed Mini Bar Khi Có Giọng Đang Được Chọn */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 dark:bg-[#0f1422]/90 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 py-3 px-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <div className="text-xs">
              <span className="text-neutral-500 dark:text-neutral-400">Giọng đọc hiện tại: </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {customVoices.find((v) => v.id === selectedVoiceId)?.name || baseVoices.find((v) => v.id === selectedVoiceId || `mx_${v.id}` === selectedVoiceId)?.name || selectedVoiceId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-110 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Vào Đọc Truyện Với Giọng Này</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tạo Giọng Đọc Chuẩn LaziBook (Ghi âm + Cắt sóng âm Waveform Canvas) */}
      <VoiceCloningModal
        isOpen={isCreateVoiceOpen}
        onClose={() => setIsCreateVoiceOpen(false)}
        onVoiceCreated={handleVoiceCreated}
      />

    </div>
  );
}
