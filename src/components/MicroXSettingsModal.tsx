'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Key,
  Sliders,
  Volume2,
  Check,
  Search,
  Loader2,
  Play,
  Pause,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Plus
} from 'lucide-react';

export interface VoiceItem {
  id: string;
  name: string;
  label: string;
  desc: string;
  provider?: 'microx' | 'edge' | 'google' | 'custom' | 'vieneu';
  gender?: 'female' | 'male';
  region?: string;
  category?: string;
  previewUrl?: string;
}

interface MicroXSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  customApiKey: string;
  onSaveApiKey: (key: string) => void;
  creativity: number;
  onSaveCreativity: (val: number) => void;
  customVoices: VoiceItem[];
  onAddCustomVoice: (voice: VoiceItem) => void;
}

export default function MicroXSettingsModal({
  isOpen,
  onClose,
  selectedVoice,
  onSelectVoice,
  customApiKey,
  onSaveApiKey,
  creativity,
  onSaveCreativity,
  customVoices,
  onAddCustomVoice,
}: MicroXSettingsModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState(customApiKey);
  const [localCreativity, setLocalCreativity] = useState(creativity);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);

  // Tìm kiếm giọng
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Thêm giọng thủ công theo ID
  const [manualVoiceId, setManualVoiceId] = useState('');
  const [manualVoiceName, setManualVoiceName] = useState('');

  // Audio preview player
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load account info when opened
  useEffect(() => {
    if (!isOpen) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        setPreviewingVoiceId(null);
      }
      return;
    }

    setApiKeyInput(customApiKey);
    setLocalCreativity(creativity);

    async function loadAccount() {
      setIsLoadingAccount(true);
      try {
        const qs = customApiKey ? `?apiKey=${encodeURIComponent(customApiKey)}` : '';
        const res = await fetch(`/api/tts/voices${qs}`);
        const data = await res.json();
        if (data.account) {
          setAccountInfo(data.account);
        }
      } catch (err) {
        console.warn('Lỗi tải thông tin MicroX:', err);
      } finally {
        setIsLoadingAccount(false);
      }
    }

    loadAccount();
  }, [isOpen, customApiKey, creativity]);

  // Tìm kiếm giọng MicroX
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const qs = new URLSearchParams({
          search: searchQuery.trim(),
          ...(customApiKey ? { apiKey: customApiKey } : {}),
        }).toString();
        const res = await fetch(`/api/tts/voices?${qs}`);
        const data = await res.json();
        setSearchResults(data.searchResults || []);
      } catch (e) {
        console.warn('Lỗi tìm giọng:', e);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, customApiKey]);

  const handlePlayPreview = (voiceId: string) => {
    if (previewingVoiceId === voiceId) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        setPreviewingVoiceId(null);
      }
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    const previewUrl = `/api/tts/voices/preview?voiceId=${encodeURIComponent(voiceId)}${
      customApiKey ? `&apiKey=${encodeURIComponent(customApiKey)}` : ''
    }`;
    const audio = new Audio(previewUrl);
    previewAudioRef.current = audio;
    setPreviewingVoiceId(voiceId);

    audio.play().catch((err) => {
      console.warn('Lỗi phát preview:', err);
      setPreviewingVoiceId(null);
    });

    audio.onended = () => {
      setPreviewingVoiceId(null);
    };
  };

  const handleSaveSettings = () => {
    onSaveApiKey(apiKeyInput.trim());
    onSaveCreativity(localCreativity);
    onClose();
  };

  const handleAddManualVoice = () => {
    if (!manualVoiceId.trim()) return;
    const cleanId = manualVoiceId.trim();
    const newVoice: VoiceItem = {
      id: cleanId,
      name: manualVoiceName.trim() || cleanId,
      label: `⭐ ${manualVoiceName.trim() || 'Giọng MicroX Custom'}`,
      desc: `Mã giọng MicroX: ${cleanId}`,
      provider: 'microx',
    };
    onAddCustomVoice(newVoice);
    onSelectVoice(cleanId);
    setManualVoiceId('');
    setManualVoiceName('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-neutral-950 font-bold" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                Cài đặt Giọng đọc & API Ngoài
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                  MicroX Voice AI
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Tích hợp hơn 3.000 giọng đọc AI biểu cảm cao cấp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Thông tin tài khoản MicroX */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-neutral-900 to-neutral-900 border border-amber-500/25">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Trạng thái kết nối MicroX
              </span>
              {isLoadingAccount ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Đang hoạt động
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mt-3">
              <div className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/80">
                <div className="text-[11px] text-neutral-400">Tài khoản</div>
                <div className="font-semibold text-neutral-200 mt-0.5">
                  {accountInfo?.name || 'Doan Bach'}
                </div>
              </div>
              <div className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/80">
                <div className="text-[11px] text-neutral-400">Số dư Credits</div>
                <div className="font-bold text-amber-400 mt-0.5">
                  {accountInfo?.credits?.toLocaleString() || '1,600,000'} Credits
                </div>
              </div>
            </div>
          </div>

          {/* Cấu hình API Key */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                MicroX API Key (Tùy chọn)
              </span>
              <span className="text-[11px] text-neutral-500 font-normal">
                Để trống nếu dùng key mặc định máy chủ
              </span>
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="mx_live_..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/60 transition"
            />
          </div>

          {/* Độ biểu cảm / Creativity */}
          <div className="space-y-2 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Độ cảm xúc / Biến thiên (Creativity):{' '}
                <span className="text-amber-400 font-mono">{localCreativity.toFixed(2)}</span>
              </label>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={localCreativity}
              onChange={(e) => setLocalCreativity(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>0.1 (Đọc tin tức, ít biến điệu)</span>
              <span className="text-amber-300 font-medium">0.5 (Tự nhiên, cân bằng)</span>
              <span>1.0 (Nhấn nhá mạnh mẽ)</span>
            </div>
          </div>

          {/* Thêm giọng thủ công theo Voice ID */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              Thêm giọng đọc MicroX theo Voice ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualVoiceName}
                onChange={(e) => setManualVoiceName(e.target.value)}
                placeholder="Tên gọi (vd: Giọng Clone của tôi)"
                className="w-1/3 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/60"
              />
              <input
                type="text"
                value={manualVoiceId}
                onChange={(e) => setManualVoiceId(e.target.value)}
                placeholder="voice_... hoặc clone_..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/60 font-mono"
              />
              <button
                type="button"
                onClick={handleAddManualVoice}
                disabled={!manualVoiceId.trim()}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-neutral-950 font-bold rounded-xl text-xs transition"
              >
                Thêm
              </button>
            </div>
          </div>

          {/* Tìm kiếm giọng trên MicroX */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              Tìm kiếm giọng đọc trong kho MicroX (3,000+ giọng)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên, vùng miền (vd: Hà Giang, Nam, Bắc, Story, Review...)"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/60 transition"
              />
              {isSearching && (
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin absolute right-3 top-2.5" />
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-neutral-950/80 rounded-xl border border-neutral-800 custom-scrollbar">
                {searchResults.map((v) => (
                  <div
                    key={v.id}
                    className="p-2 rounded-lg bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800/60 flex items-center justify-between text-xs transition"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-semibold text-neutral-200 truncate flex items-center gap-1.5">
                        <span>{v.name}</span>
                        {v.region && (
                          <span className="text-[10px] text-amber-400/90 bg-amber-500/10 px-1.5 py-0.2 rounded font-normal uppercase">
                            {v.region}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono truncate">{v.id}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handlePlayPreview(v.id)}
                        className={`p-1.5 rounded-lg transition ${
                          previewingVoiceId === v.id
                            ? 'bg-amber-500 text-neutral-950'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                        }`}
                        title="Nghe thử"
                      >
                        {previewingVoiceId === v.id ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          const item: VoiceItem = {
                            id: v.id,
                            name: v.name,
                            label: `⭐ ${v.name}`,
                            desc: `MicroX: ${v.region || ''} ${v.gender || ''}`,
                            provider: 'microx',
                          };
                          onAddCustomVoice(item);
                          onSelectVoice(v.id);
                        }}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-neutral-950 font-bold rounded-lg text-[11px] transition"
                      >
                        Dùng
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-neutral-800 bg-neutral-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            Đóng
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition shadow-lg shadow-amber-500/20"
          >
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  );
}
