'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Radio,
  Loader2,
  ChevronDown,
  UserCheck,
  Gauge,
  Settings,
  Moon,
  Clock,
  RotateCcw,
  CloudRain,
  Download,
  Check,
  Zap,
  CheckCircle2
} from 'lucide-react';
import MicroXSettingsModal from './MicroXSettingsModal';
import { ambientAudioEngine, AMBIENT_SOUND_OPTIONS, AmbientSoundType } from '@/lib/ambientSound';
import { LAZIBOOK_NANO_VOICES } from '@/data/voices';

export interface SentenceItem {
  id: number;
  text: string;
  paragraphIndex: number;
}

interface AudioPlayerBarProps {
  sentences: SentenceItem[];
  chapterTitle: string;
  storyTitle?: string;
  coverUrl?: string;
  activeSentenceIndex: number;
  autoPlayOnMount?: boolean;
  onSentenceChange: (index: number) => void;
  onNextChapter?: () => void;
  onClose: () => void;
}

export interface VoiceItem {
  id: string;
  name: string;
  label: string;
  desc: string;
  provider?: 'microx' | 'edge' | 'google' | 'custom';
  gender?: 'female' | 'male';
  region?: string;
}

// 1. Kho Giọng Microsoft Edge Neural Gốc
const NANO_VOICES: VoiceItem[] = LAZIBOOK_NANO_VOICES.map((v) => ({
  id: v.id,
  name: v.name,
  label: `${v.gender === 'male' ? '🎙️' : '🌸'} ${v.name} (${v.regionLabel})`,
  desc: v.tagline,
  provider: 'custom',
  gender: v.gender,
  region: v.region,
}));

// 2. Giọng Google & Kể Chuyện Phong Cách
const STANDARD_VOICES: VoiceItem[] = [
  {
    id: 'story-male',
    name: 'Kể Chuyện Đêm (Nam Trầm)',
    label: '📻 Kể Chuyện Đêm (Nam Trầm Phong Cách MC)',
    desc: 'Tông nam trầm ấm, nhả chữ chậm rãi, có chiều sâu phong cách đọc truyện đêm khuya',
    provider: 'edge',
    gender: 'male',
  },
  {
    id: 'story-female',
    name: 'Kể Chuyện Thư Thái',
    label: '📖 Kể Chuyện Thư Thái (Nữ Trầm Dịu Êm)',
    desc: 'Tông nữ trầm nhẹ nhàng, du dương ru ngủ, rất hợp nghe thư giãn buổi tối',
    provider: 'edge',
    gender: 'female',
  },
  {
    id: 'google',
    name: 'Google',
    label: '⚡ Google Tiếng Việt (Tốc Độ Cao)',
    desc: 'Giọng đọc chuẩn Google Tiếng Việt ổn định tuyệt đối',
    provider: 'google',
    gender: 'female',
  },
];

// 3. Giọng MicroX AI Clone (Đã tích hợp sẵn API Key máy chủ)
const MICROX_VOICES: VoiceItem[] = [
  {
    id: 'voice_717f9e7c4a371d668b7dd242',
    name: 'Ngọc Ngạn',
    label: '⭐ Ngọc Ngạn (MicroX AI Clone)',
    desc: 'Giọng clone MC Nguyễn Ngọc Ngạn từ MicroX AI',
    provider: 'microx',
    gender: 'male',
  },
  {
    id: 'voice_e347bfc946cc9232466347ca',
    name: 'Hà Giang',
    label: '⭐ Hà Giang (MicroX Nữ Bắc)',
    desc: 'Giọng nữ Bắc ngọt ngào từ MicroX AI',
    provider: 'microx',
    gender: 'female',
  },
  {
    id: 'voice_bc521fe706b858344a590567',
    name: 'Vincente Toàn',
    label: '⭐ Vincente Toàn (MicroX Nam Bắc)',
    desc: 'Giọng nam Bắc kể chuyện từ MicroX AI',
    provider: 'microx',
    gender: 'male',
  },
  {
    id: 'voice_42a7dc8e1d41998bf7aa5d7e',
    name: 'Thúy Tiên',
    label: '⭐ Thúy Tiên (MicroX Nữ Bắc)',
    desc: 'Giọng đọc văn học từ MicroX AI',
    provider: 'microx',
    gender: 'female',
  },
  {
    id: 'voice_960b820ba17f73e1ae5a342a',
    name: 'Huyền',
    label: '⭐ Huyền (MicroX Nữ Nam)',
    desc: 'Giọng nữ Nam bộ từ MicroX AI',
    provider: 'microx',
    gender: 'female',
  },
  {
    id: 'voice_58c3f1cae6744f008a5048fd',
    name: 'Quang Toàn',
    label: '⭐ Quang Toàn (MicroX Nam Nam)',
    desc: 'Giọng nam miền Nam từ MicroX AI',
    provider: 'microx',
    gender: 'male',
  },
  {
    id: 'voice_4a3e1a0409e4c2bb591bf6f9',
    name: 'Nhật Nam',
    label: '⭐ Nhật Nam (MicroX Nam Bắc)',
    desc: 'Giọng nam tự nhiên từ MicroX AI',
    provider: 'microx',
    gender: 'male',
  },
];

const DEFAULT_VOICES: VoiceItem[] = [
  ...NANO_VOICES,
  ...STANDARD_VOICES,
  ...MICROX_VOICES,
];

export interface SpeedOption {
  value: number;
  label: string;
}

const SPEED_OPTIONS: SpeedOption[] = [
  { value: 0.75, label: '0.75x (Chậm)' },
  { value: 0.85, label: '0.85x (Chậm vừa)' },
  { value: 1.0, label: '1.0x (Bình thường)' },
  { value: 1.15, label: '1.15x (Hơi nhanh)' },
  { value: 1.25, label: '1.25x (Nhanh)' },
  { value: 1.5, label: '1.5x (Rất nhanh)' },
  { value: 1.75, label: '1.75x (Cực nhanh)' },
  { value: 2.0, label: '2.0x (Gấp đôi)' },
];

export default function AudioPlayerBar({
  sentences,
  chapterTitle,
  storyTitle = 'Tả Ao Reader',
  coverUrl,
  activeSentenceIndex,
  autoPlayOnMount = false,
  onSentenceChange,
  onNextChapter,
  onClose,
}: AudioPlayerBarProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bientruyen_tts_speed');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0.5 && val <= 3.0) return val;
      }
    }
    return 1.0;
  });
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [autoNext, setAutoNext] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bientruyen_tts_autonext');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bientruyen_tts_voice');
      if (saved) return saved;
    }
    return 'namminh';
  });
  const [bufferedCount, setBufferedCount] = useState<number>(0); // Số câu đã đệm trước trong RAM
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [voiceTab, setVoiceTab] = useState<'nano' | 'standard' | 'microx'>('nano');
  const [nanoRegion, setNanoRegion] = useState<'all' | 'bac' | 'trung' | 'nam'>('all');
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number>(0); // 0 = tắt, 15, 30, 45, 60, -1 = hết chương
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number>(0); // Giây đếm ngược
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [creativity, setCreativity] = useState<number>(0.5);
  const [customVoices, setCustomVoices] = useState<VoiceItem[]>([]);
  const [ambientType, setAmbientType] = useState<AmbientSoundType>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.25);
  const [showAmbientMenu, setShowAmbientMenu] = useState(false);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);

  // Trạng thái Tải trước Audio cả chương (Pre-generate Audiobook Engine)
  const [showPrecacheModal, setShowPrecacheModal] = useState(false);
  const [precacheStatus, setPrecacheStatus] = useState<'idle' | 'checking' | 'running' | 'paused' | 'completed' | 'error'>('idle');
  const [precacheProgress, setPrecacheProgress] = useState({
    total: sentences.length,
    cached: 0,
    current: 0,
    text: '',
  });
  const precacheAbortRef = useRef<boolean>(false);

  // Bộ nhớ đệm RAM chứa ObjectURL âm thanh đã tải sẵn (Zero-latency playback)
  const audioBlobCacheRef = useRef<Map<string, string>>(new Map());
  const activePrefetchesRef = useRef<Set<string>>(new Set());
  const voiceEpochRef = useRef<number>(1);

  // Ping-Pong Dual-Deck Audio Engine (Chống ngắt quãng, chuyển câu 0ms liền mạch tuyệt đối)
  const deckARef = useRef<HTMLAudioElement | null>(null);
  const deckBRef = useRef<HTMLAudioElement | null>(null);
  const activeDeckRef = useRef<'A' | 'B'>('A');
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const handoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentIndexRef = useRef<number>(activeSentenceIndex);
  const selectedVoiceRef = useRef<string>(selectedVoice);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const playbackRateRef = useRef<number>(playbackRate);
  const isMutedRef = useRef<boolean>(isMuted);

  useEffect(() => {
    currentIndexRef.current = activeSentenceIndex;
  }, [activeSentenceIndex]);

  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
    if (deckARef.current) deckARef.current.playbackRate = playbackRate;
    if (deckBRef.current) deckBRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    isMutedRef.current = isMuted;
    if (deckARef.current) deckARef.current.muted = isMuted;
    if (deckBRef.current) deckBRef.current.muted = isMuted;
  }, [isMuted]);

  // Bộ đếm ngược Hẹn giờ tắt (Sleep Timer Countdown)
  useEffect(() => {
    if (sleepTimerMinutes <= 0) {
      setSleepTimeRemaining(0);
      return;
    }

    setSleepTimeRemaining(sleepTimerMinutes * 60);

    const interval = setInterval(() => {
      setSleepTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Hết giờ -> Tự động dừng audio
          handleStop();
          setSleepTimerMinutes(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerMinutes]);

  // Đồng bộ Âm nền thư giãn (Ambient Audio Mixer - LaziBook Style)
  useEffect(() => {
    ambientAudioEngine.setVolume(ambientVolume);
  }, [ambientVolume]);

  useEffect(() => {
    if (isPlaying && ambientType !== 'none') {
      ambientAudioEngine.setSound(ambientType);
      ambientAudioEngine.resume();
    } else {
      ambientAudioEngine.pause();
    }
  }, [isPlaying, ambientType]);

  useEffect(() => {
    return () => {
      if (handoverTimerRef.current) {
        clearInterval(handoverTimerRef.current);
        handoverTimerRef.current = null;
      }
      ambientAudioEngine.stop();
      if (deckARef.current) {
        deckARef.current.pause();
        deckARef.current.src = '';
      }
      if (deckBRef.current) {
        deckBRef.current.pause();
        deckBRef.current.src = '';
      }
    };
  }, []);

  // Đọc cấu hình giọng & API đã lưu
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('bientruyen_microx_api_key') || '';
      if (savedKey) setCustomApiKey(savedKey);

      const savedCreativity = localStorage.getItem('bientruyen_microx_creativity');
      if (savedCreativity) setCreativity(parseFloat(savedCreativity));

      const savedCustomVoices = localStorage.getItem('bientruyen_custom_voices');
      if (savedCustomVoices) setCustomVoices(JSON.parse(savedCustomVoices));

      const savedVoice = localStorage.getItem('bientruyen_tts_voice');
      if (savedVoice) {
        setSelectedVoice(savedVoice);
      }
    } catch (e) {}
  }, []);

  const allVoices = [...DEFAULT_VOICES, ...customVoices];

  const handleSaveApiKey = (key: string) => {
    setCustomApiKey(key);
    try {
      if (key) localStorage.setItem('bientruyen_microx_api_key', key);
      else localStorage.removeItem('bientruyen_microx_api_key');
    } catch (e) {}
  };

  const handleSaveCreativity = (val: number) => {
    setCreativity(val);
    try {
      localStorage.setItem('bientruyen_microx_creativity', val.toString());
    } catch (e) {}
  };

  const handleAddCustomVoice = (voice: VoiceItem) => {
    setCustomVoices((prev) => {
      const filtered = prev.filter((v) => v.id !== voice.id);
      const updated = [voice, ...filtered];
      try {
        localStorage.setItem('bientruyen_custom_voices', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Helper tạo URL TTS
  const getTTSUrl = useCallback(
    (text: string, voice?: string) => {
      const v = voice || selectedVoiceRef.current || 'voice_717f9e7c4a371d668b7dd242';
      const isMicroX = (v.startsWith('voice_') || v.startsWith('mx_')) && !v.startsWith('clone_');
      let url = `/api/tts?text=${encodeURIComponent(text.trim())}&voice=${encodeURIComponent(v)}`;
      if (playbackRate !== 1.0) url += `&speed=${playbackRate}`;
      if (isMicroX && creativity !== 0.5) url += `&creativity=${creativity}`;
      if (customApiKey) url += `&apiKey=${encodeURIComponent(customApiKey)}`;

      // Đính kèm giới tính, pitch & rate cá nhân hóa nếu đây là giọng clone do người dùng tạo
      const customV = customVoices.find((cv) => cv.id === v);
      if (customV) {
        if (customV.gender) {
          url += `&gender=${encodeURIComponent(customV.gender)}`;
        }
        if ((customV as any).edgePitch) {
          url += `&pitch=${encodeURIComponent((customV as any).edgePitch)}`;
        }
        if ((customV as any).edgeRate) {
          url += `&rate=${encodeURIComponent((customV as any).edgeRate)}`;
        }
      }

      return url;
    },
    [playbackRate, creativity, customApiKey, customVoices]
  );

  // Tải ngầm MP3 về RAM dưới dạng Blob ObjectURL kèm kiểm tra Epoch chống trộn giọng
  const fetchAudioBlob = useCallback(async (url: string, highPriority = false): Promise<string> => {
    const epoch = voiceEpochRef.current;
    if (audioBlobCacheRef.current.has(url)) {
      return audioBlobCacheRef.current.get(url)!;
    }

    if (activePrefetchesRef.current.has(url)) {
      // Câu ưu tiên cao (đang phát): chờ ngắn hơn (50ms x 60 = 3s tối đa)
      const maxWait = highPriority ? 60 : 30;
      const interval = highPriority ? 50 : 100;
      for (let i = 0; i < maxWait; i++) {
        await new Promise((r) => setTimeout(r, interval));
        if (epoch !== voiceEpochRef.current) return url;
        if (audioBlobCacheRef.current.has(url)) {
          return audioBlobCacheRef.current.get(url)!;
        }
      }
      return url;
    }

    activePrefetchesRef.current.add(url);
    try {
      // Câu đang cần phát ngay dùng priority high, prefetch ngầm dùng low
      const fetchPriority = highPriority ? 'high' : 'low';
      const res = await fetch(url, { priority: fetchPriority } as any);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();

      // Nếu trong lúc tải người dùng đã đổi giọng khác, lập tức vứt bỏ blob này không cho vào cache
      if (epoch !== voiceEpochRef.current) {
        return url;
      }

      const blobUrl = URL.createObjectURL(blob);

      // Quản lý dung lượng RAM: giữ tối đa 30 câu trong RAM
      if (audioBlobCacheRef.current.size >= 30) {
        const firstKey = audioBlobCacheRef.current.keys().next().value;
        if (firstKey) {
          const oldUrl = audioBlobCacheRef.current.get(firstKey);
          if (oldUrl && oldUrl.startsWith('blob:')) URL.revokeObjectURL(oldUrl);
          audioBlobCacheRef.current.delete(firstKey);
        }
      }

      audioBlobCacheRef.current.set(url, blobUrl);
      return blobUrl;
    } catch (err) {
      console.warn('Lỗi tải ngầm Blob audio:', err);
      return url;
    } finally {
      activePrefetchesRef.current.delete(url);
    }
  }, []);

  // Cơ chế Chạy Trước (Buffer-Ahead Engine): Nạp SONG SONG các câu kế tiếp vào RAM
  const prefetchQueue = useCallback(
    async (startIndex: number, count = 2, voiceOverride?: string) => {
      const voice = voiceOverride || selectedVoiceRef.current || 'hoaimy';
      const isMicroX = voice.startsWith('voice_') || voice.startsWith('mx_') || voice.startsWith('clone_');
      
      // Giới hạn: MicroX chỉ nạp trước duy nhất 1 câu tiếp theo để tránh vượt quá concurrency limit (429)
      const actualCount = isMicroX ? 1 : Math.min(count, 3);

      // Nạp song song tất cả câu cần prefetch (không tuần tự) để giảm latency tổng thể
      const fetchTasks = [];
      for (let i = startIndex; i < startIndex + actualCount && i < sentences.length; i++) {
        if (i < 0) continue;
        const text = sentences[i]?.text?.trim();
        if (!text) continue;

        const url = getTTSUrl(text, voice);
        if (!audioBlobCacheRef.current.has(url)) {
          fetchTasks.push(fetchAudioBlob(url));
        }
      }

      if (fetchTasks.length > 0) {
        try {
          await Promise.all(fetchTasks);
          // Cập nhật bộ đếm câu đã đệm sẵn
          let countReady = 0;
          const current = currentIndexRef.current;
          for (let j = current + 1; j <= current + 4 && j < sentences.length; j++) {
            const u = getTTSUrl(sentences[j]?.text?.trim() || '', voice);
            if (audioBlobCacheRef.current.has(u)) countReady++;
          }
          setBufferedCount(countReady);
        } catch (e) {
          console.warn('Lỗi nạp ngầm audio (prefetchQueue):', e);
        }
      }
    },
    [sentences, getTTSUrl, fetchAudioBlob]
  );

  // Kiểm tra tình trạng cache của chương trên máy chủ VPS
  const handleCheckPrecacheStatus = useCallback(async () => {
    if (!sentences || sentences.length === 0) return;
    setPrecacheStatus('checking');
    try {
      const res = await fetch('/api/tts/pregenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentences: sentences.map((s) => s.text),
          voice: selectedVoice,
          speed: playbackRate,
          creativity,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPrecacheProgress({
          total: data.total,
          cached: data.cachedCount,
          current: 0,
          text: '',
        });
        if (data.isFullyCached) {
          setPrecacheStatus('completed');
        } else {
          setPrecacheStatus('idle');
        }
      } else {
        setPrecacheStatus('idle');
      }
    } catch (e) {
      setPrecacheStatus('idle');
    }
  }, [sentences, selectedVoice, playbackRate, creativity]);

  // Bắt đầu quy trình tải ngầm và tạo trước toàn bộ câu trong chương (Zero-latency offline ready)
  const handleStartPrecache = useCallback(async () => {
    if (!sentences || sentences.length === 0) return;
    precacheAbortRef.current = false;
    setPrecacheStatus('running');

    const total = sentences.length;
    let done = precacheProgress.cached || 0;

    // Concurrency = 2 (tải song song 2 câu một lúc để tăng tốc độ gấp đôi mà không nghẽn máy chủ)
    const queue = sentences.map((s, idx) => ({ ...s, originalIndex: idx }));

    const worker = async () => {
      while (queue.length > 0 && !precacheAbortRef.current) {
        const item = queue.shift();
        if (!item || !item.text?.trim()) continue;

        const text = item.text.trim();
        const url = getTTSUrl(text, selectedVoice);

        setPrecacheProgress((prev) => ({
          ...prev,
          total,
          current: item.originalIndex + 1,
          text: text.slice(0, 80) + (text.length > 80 ? '...' : ''),
        }));

        try {
          if (!audioBlobCacheRef.current.has(url)) {
            await fetchAudioBlob(url);
          }
          done++;
          setPrecacheProgress((prev) => ({
            ...prev,
            cached: Math.min(total, done),
          }));
        } catch (err) {
          console.warn('Lỗi tải ngầm câu:', item.originalIndex, err);
        }
      }
    };

    // Chạy song song 2 worker
    await Promise.all([worker(), worker()]);

    if (precacheAbortRef.current) {
      setPrecacheStatus('paused');
    } else {
      setPrecacheStatus('completed');
      setPrecacheProgress((prev) => ({
        ...prev,
        cached: total,
        current: total,
        text: 'Toàn bộ chương đã sẵn sàng!',
      }));
    }
  }, [sentences, selectedVoice, precacheProgress.cached, getTTSUrl, fetchAudioBlob]);

  const handleStopPrecache = () => {
    precacheAbortRef.current = true;
    setPrecacheStatus('paused');
  };

  // Tự động nạp trước đúng 1 câu đầu tiên khi mở chương
  useEffect(() => {
    if (sentences && sentences.length > 0) {
      prefetchQueue(activeSentenceIndex, 1);
    }
  }, [sentences, activeSentenceIndex, prefetchQueue]);

  // Đăng ký MediaSession API hoàn chỉnh để điều khiển khi khóa màn hình (Lock screen / Background playback)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: chapterTitle,
          artist: 'Tả Ao Reader',
          album: storyTitle,
          artwork: [
            {
              src: coverUrl || '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        });

        navigator.mediaSession.setActionHandler('play', () => {
          handleTogglePlay();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          handleTogglePlay();
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          handlePrev();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          handleNext();
        });
      } catch (e) {
        console.warn('Lỗi cấu hình MediaSession:', e);
      }
    }
  }, [chapterTitle, storyTitle, coverUrl]);

  // Cập nhật trạng thái phát cho MediaSession
  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      } catch (e) {}
    }
  }, [isPlaying]);

  // Bật/tắt tự động chuyển chương
  const toggleAutoNext = () => {
    const nextVal = !autoNext;
    setAutoNext(nextVal);
    try {
      localStorage.setItem('bientruyen_tts_autonext', nextVal.toString());
    } catch (e) {}
    setVoiceToast(nextVal ? '🔁 Đã BẬT: Nghe xong tự chuyển chương kế tiếp' : '⏹️ Đã TẮT: Dừng lại khi hết chương');
    setTimeout(() => setVoiceToast(null), 2500);
  };

  // Tự động phát tiếp câu 0 khi chương kế tiếp nạp xong (Continuous Audiobook Stream)
  useEffect(() => {
    if (autoPlayOnMount && sentences && sentences.length > 0) {
      const timer = setTimeout(() => {
        playSentence(0);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoPlayOnMount, sentences]);

  // Khởi tạo deck A và B
  const ensureDecks = () => {
    if (!deckARef.current && typeof window !== 'undefined') {
      const dA = new Audio();
      dA.preload = 'auto';
      deckARef.current = dA;
    }
    if (!deckBRef.current && typeof window !== 'undefined') {
      const dB = new Audio();
      dB.preload = 'auto';
      deckBRef.current = dB;
    }
  };

  // Hàm phát âm thanh chính theo từng CÂU (Ping-Pong Dual-Deck Seamless Audio Engine)
  const playSentence = useCallback(
    async (index: number, voiceOverride?: string) => {
      if (index < 0 || index >= sentences.length) {
        setIsPlaying(false);
        setIsLoading(false);
        return;
      }

      const item = sentences[index];
      const text = item?.text?.trim();
      if (!text) {
        const nextIdx = index + 1;
        onSentenceChange(nextIdx);
        playSentence(nextIdx, voiceOverride);
        return;
      }

      ensureDecks();
      onSentenceChange(index);
      currentIndexRef.current = index;

      const voice = voiceOverride || selectedVoiceRef.current || 'hoaimy';
      const isA = activeDeckRef.current === 'A';
      const currentDeck = isA ? deckARef.current! : deckBRef.current!;
      const standbyDeck = isA ? deckBRef.current! : deckARef.current!;
      currentAudioRef.current = currentDeck;

      // Dọn listener cũ trên cả 2 deck
      currentDeck.ontimeupdate = null;
      currentDeck.onended = null;
      currentDeck.onerror = null;
      currentDeck.onwaiting = null;
      currentDeck.oncanplay = null;

      standbyDeck.ontimeupdate = null;
      standbyDeck.onended = null;
      standbyDeck.onerror = null;

      const targetUrl = getTTSUrl(text, voice);
      const cachedBlobUrl = audioBlobCacheRef.current.get(targetUrl);

      // Thiết lập sẵn handover timer và các listener trước khi play
      currentDeck.playbackRate = playbackRateRef.current;
      currentDeck.muted = isMutedRef.current;

      // Chuẩn bị câu kế tiếp cho Standby Deck ngay lập tức (không await)
      const nextIdx = index + 1;
      if (nextIdx < sentences.length) {
        const nextText = sentences[nextIdx]?.text?.trim();
        if (nextText) {
          const nextUrl = getTTSUrl(nextText, voice);
          fetchAudioBlob(nextUrl).then((blobUrl) => {
            if (blobUrl && standbyDeck) {
              standbyDeck.src = blobUrl;
              standbyDeck.preload = 'auto';
              standbyDeck.playbackRate = playbackRateRef.current;
              standbyDeck.muted = isMutedRef.current;
              standbyDeck.load();
            }
          }).catch(() => {});
        }
      }

      // Xử lý chuyển đổi Ping-Pong liền mạch 0ms (Handshake trước khi câu cũ dứt)
      let hasHandedOver = false;
      const doHandover = () => {
        if (hasHandedOver) return;
        hasHandedOver = true;
        if (handoverTimerRef.current) {
          clearInterval(handoverTimerRef.current);
          handoverTimerRef.current = null;
        }
        currentDeck.onended = null;

        if (nextIdx < sentences.length) {
          // Hoán đổi vai trò giữa 2 Deck
          activeDeckRef.current = isA ? 'B' : 'A';
          // Cho deck cũ phát nốt 350ms đuôi âm cuối cùng để tạo hiệu ứng nối từ tự nhiên không ngắt cụt
          const oldDeck = currentDeck;
          setTimeout(() => {
            try {
              if (activeDeckRef.current !== (isA ? 'A' : 'B')) {
                oldDeck.pause();
              }
            } catch (e) {}
          }, 350);

          playSentence(nextIdx, voiceOverride);
        } else {
          // Hết toàn bộ chương
          setIsPlaying(false);
          setIsLoading(false);
          if (sleepTimerMinutes === -1) {
            setSleepTimerMinutes(0);
            return;
          }
          if (autoNext && onNextChapter) {
            onNextChapter();
          }
        }
      };

      // Đón đầu 320ms trước khi câu kết thúc bằng timer tần số cao 25ms (Early Overlap Handover Engine):
      const setupHandoverTimer = () => {
        if (handoverTimerRef.current) {
          clearInterval(handoverTimerRef.current);
          handoverTimerRef.current = null;
        }
        handoverTimerRef.current = setInterval(() => {
          if (!isPlayingRef.current) {
            if (handoverTimerRef.current) {
              clearInterval(handoverTimerRef.current);
              handoverTimerRef.current = null;
            }
            return;
          }
          const dur = currentDeck.duration;
          const cur = currentDeck.currentTime;
          if (dur && dur > 0.4 && cur > 0) {
            const timeLeft = dur - cur;
            if (timeLeft <= 0.32) {
              doHandover();
            }
          }
        }, 25);
      };

      currentDeck.onended = () => {
        doHandover();
      };

      currentDeck.onerror = (e) => {
        console.warn('Lỗi phát âm thanh câu hiện tại:', e);
        if (handoverTimerRef.current) {
          clearInterval(handoverTimerRef.current);
          handoverTimerRef.current = null;
        }
        setIsLoading(false);
        // Chụp index tại thời điểm gặp lỗi để tránh retry sai câu
        const retryIndex = currentIndexRef.current;
        setTimeout(() => {
          if (isPlayingRef.current && currentIndexRef.current === retryIndex) {
            playSentence(retryIndex, voiceOverride);
          }
        }, 1200);
      };

      currentDeck.onwaiting = () => setIsLoading(true);
      currentDeck.oncanplay = () => setIsLoading(false);

      const startPlayback = async (srcUrl: string) => {
        if (currentDeck.src !== srcUrl) {
          currentDeck.src = srcUrl;
        }
        setupHandoverTimer();
        try {
          await currentDeck.play();
          setIsPlaying(true);
          setIsLoading(false);
          // Nạp trước thêm câu vào RAM (song song, không chặn luồng phát)
          const isMicroX = voice.startsWith('voice_') || voice.startsWith('mx_') || voice.startsWith('clone_');
          prefetchQueue(index + 2, isMicroX ? 1 : 3, voiceOverride);
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.warn('Playback error:', err);
          }
          setIsLoading(false);
        }
      };

      if (cachedBlobUrl) {
        // Đã có blob → phát ngay không cần fetch
        await startPlayback(cachedBlobUrl);
      } else {
        // Chưa có blob → fetch với độ ưu tiên cao (đây là câu đang cần phát NGAY)
        // Dùng blob để tránh double-fetch race condition với browser
        setIsLoading(true);
        fetchAudioBlob(targetUrl, true).then(async (blobUrl) => {
          if (!isPlayingRef.current && !blobUrl.startsWith('blob:')) return; // Đã dừng trong lúc fetch
          if (currentIndexRef.current !== index) return; // Người dùng đã nhảy sang câu khác
          await startPlayback(blobUrl);
        }).catch(async () => {
          // Fallback: dùng URL trực tiếp nếu fetchAudioBlob thất bại hoàn toàn
          await startPlayback(targetUrl);
        });
      }
    },
    [sentences, autoNext, sleepTimerMinutes, onNextChapter, onSentenceChange, getTTSUrl, prefetchQueue, fetchAudioBlob]
  );

  // Đổi giọng đọc: nếu đang phát, lập tức phát lại câu hiện tại với giọng mới
  const handleSelectVoice = (voiceId: string) => {
    if (handoverTimerRef.current) {
      clearInterval(handoverTimerRef.current);
      handoverTimerRef.current = null;
    }
    voiceEpochRef.current += 1;
    setSelectedVoice(voiceId);
    selectedVoiceRef.current = voiceId; // Gán đồng bộ ngay lập tức để không bị lệch giọng
    setShowVoiceMenu(false);
    try {
      localStorage.setItem('bientruyen_tts_voice', voiceId);
    } catch (e) {}

    // Dọn dẹp TOÀN BỘ cache ObjectURL cũ để tuyệt đối không bị trộn giọng cũ vào
    audioBlobCacheRef.current.forEach((url) => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
    audioBlobCacheRef.current.clear();
    activePrefetchesRef.current.clear();

    // Dừng cả 2 deck
    if (deckARef.current) {
      deckARef.current.pause();
      deckARef.current.ontimeupdate = null;
      deckARef.current.onended = null;
      deckARef.current.src = '';
    }
    if (deckBRef.current) {
      deckBRef.current.pause();
      deckBRef.current.ontimeupdate = null;
      deckBRef.current.onended = null;
      deckBRef.current.src = '';
    }

    // Hiển thị phản hồi trực quan tức thì trên mobile
    const chosenVoice = allVoices.find((v) => v.id === voiceId);
    setVoiceToast(chosenVoice?.name || 'Giọng mới');
    setTimeout(() => setVoiceToast(null), 3000);

    // Kích hoạt phát ngay câu hiện tại bằng giọng mới (đáp ứng thao tác người dùng)
    playSentence(currentIndexRef.current, voiceId);
  };

  // Điều khiển Phát / Tạm dừng
  const handleTogglePlay = () => {
    ensureDecks();
    const isA = activeDeckRef.current === 'A';
    const curDeck = isA ? deckARef.current : deckBRef.current;

    if (isPlaying) {
      if (handoverTimerRef.current) {
        clearInterval(handoverTimerRef.current);
        handoverTimerRef.current = null;
      }
      if (curDeck) curDeck.pause();
      setIsPlaying(false);
    } else {
      if (curDeck && curDeck.src && curDeck.currentTime > 0 && !curDeck.ended) {
        curDeck.play().then(() => {
          setIsPlaying(true);
          const nextIdx = currentIndexRef.current + 1;
          if (handoverTimerRef.current) {
            clearInterval(handoverTimerRef.current);
            handoverTimerRef.current = null;
          }
          handoverTimerRef.current = setInterval(() => {
            if (!isPlayingRef.current) {
              if (handoverTimerRef.current) {
                clearInterval(handoverTimerRef.current);
                handoverTimerRef.current = null;
              }
              return;
            }
            const dur = curDeck.duration;
            const cur = curDeck.currentTime;
            if (dur && dur > 0.4 && cur > 0) {
              if (dur - cur <= 0.32) {
                if (handoverTimerRef.current) {
                  clearInterval(handoverTimerRef.current);
                  handoverTimerRef.current = null;
                }
                if (nextIdx < sentences.length) {
                  activeDeckRef.current = isA ? 'B' : 'A';
                  playSentence(nextIdx);
                } else if (autoNext && onNextChapter) {
                  onNextChapter();
                }
              }
            }
          }, 25);
        });
      } else {
        playSentence(currentIndexRef.current);
      }
    }
  };

  // Dừng hẳn
  const handleStop = () => {
    if (handoverTimerRef.current) {
      clearInterval(handoverTimerRef.current);
      handoverTimerRef.current = null;
    }
    if (deckARef.current) {
      deckARef.current.pause();
      deckARef.current.currentTime = 0;
      deckARef.current.ontimeupdate = null;
      deckARef.current.onended = null;
    }
    if (deckBRef.current) {
      deckBRef.current.pause();
      deckBRef.current.currentTime = 0;
      deckBRef.current.ontimeupdate = null;
      deckBRef.current.onended = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
    ambientAudioEngine.stop();
  };

  // Lùi 1 câu
  const handlePrev = () => {
    if (handoverTimerRef.current) {
      clearInterval(handoverTimerRef.current);
      handoverTimerRef.current = null;
    }
    const prevIdx = Math.max(0, currentIndexRef.current - 1);
    playSentence(prevIdx);
  };

  // Tiến 1 câu
  const handleNext = () => {
    if (handoverTimerRef.current) {
      clearInterval(handoverTimerRef.current);
      handoverTimerRef.current = null;
    }
    const nextIdx = Math.min(sentences.length - 1, currentIndexRef.current + 1);
    playSentence(nextIdx);
  };

  // Chọn trực tiếp tốc độ đọc
  const handleSelectSpeed = (speed: number) => {
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
  };

  // Thay đổi tốc độ đọc (chu kỳ xoay vòng nếu cần)
  const cyclePlaybackRate = () => {
    const currentIdx = SPEED_OPTIONS.findIndex((o) => o.value === playbackRate);
    const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % SPEED_OPTIONS.length : 2;
    setPlaybackRate(SPEED_OPTIONS[nextIdx].value);
  };

  // Định dạng thời gian đếm ngược (mm:ss)
  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Dọn dẹp khi unmount
  useEffect(() => {
    return () => {
      if (deckARef.current) {
        deckARef.current.pause();
        deckARef.current.src = '';
      }
      if (deckBRef.current) {
        deckBRef.current.pause();
        deckBRef.current.src = '';
      }
      audioBlobCacheRef.current.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      audioBlobCacheRef.current.clear();
    };
  }, []);

  const progressPercent =
    sentences.length > 0
      ? Math.round(((activeSentenceIndex + 1) / sentences.length) * 100)
      : 0;

  const currentVoiceObj =
    allVoices.find((v) => v.id === selectedVoice) || allVoices[0];

  const nanoVoices = allVoices.filter((v) => v.provider === 'custom');
  const filteredNanoVoices = nanoVoices.filter((v) => {
    if (nanoRegion === 'all') return true;
    return v.region === nanoRegion;
  });
  const standardVoices = allVoices.filter((v) => v.provider === 'edge' || v.provider === 'google');
  const microxVoices = allVoices.filter((v) => v.provider === 'microx');

  return (
    <div className="fixed bottom-0 left-0 right-0 sm:bottom-3 sm:left-4 sm:right-4 max-w-3xl mx-auto z-50 transition-all duration-300">
      {/* Toast thông báo đã đổi giọng AI trực quan cho mobile */}
      {voiceToast && (
        <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-amber-500 text-neutral-950 font-black text-xs px-4 py-1.5 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-2 z-50 flex items-center gap-1.5 whitespace-nowrap border border-amber-400">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>Đang phát: {voiceToast}</span>
        </div>
      )}

      <div className="bg-neutral-900/98 dark:bg-black/98 text-white backdrop-blur-2xl border-t sm:border border-neutral-700/80 rounded-t-2xl sm:rounded-2xl shadow-2xl relative px-3 py-2 sm:px-4 sm:py-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
        {/* Menu chọn giọng đọc (Pop-up) */}
        {showVoiceMenu && (
          <div className="absolute bottom-full mb-3 left-2 right-2 sm:left-4 sm:right-auto sm:w-96 max-h-[85vh] bg-neutral-900 border border-neutral-700 rounded-2xl p-2.5 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-bottom-2 flex flex-col">
            <div className="px-2 py-1.5 border-b border-neutral-800 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Kho Giọng Đọc AI (LaziBook Studio)
              </span>
              <button
                type="button"
                onClick={() => setShowVoiceMenu(false)}
                className="text-neutral-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Tab Danh Mục Giọng Chuẩn */}
            <div className="grid grid-cols-3 gap-1 pt-2 pb-1.5 border-b border-neutral-800/80 shrink-0">
              <button
                type="button"
                onClick={() => setVoiceTab('nano')}
                className={`py-1.5 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  voiceTab === 'nano'
                    ? 'bg-amber-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-800/60 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <span>🎙️ VieNeu (29 Giọng)</span>
              </button>
              <button
                type="button"
                onClick={() => setVoiceTab('standard')}
                className={`py-1.5 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  voiceTab === 'standard'
                    ? 'bg-amber-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-800/60 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <span>⚡ Chuẩn AI</span>
              </button>
              <button
                type="button"
                onClick={() => setVoiceTab('microx')}
                className={`py-1.5 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  voiceTab === 'microx'
                    ? 'bg-amber-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-800/60 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <span>⭐ MicroX Clone</span>
              </button>
            </div>

            {/* Sub-filter Vùng Miền cho Tab Nano */}
            {voiceTab === 'nano' && (
              <div className="flex items-center gap-1 pt-2 pb-1.5 shrink-0 overflow-x-auto no-scrollbar border-b border-neutral-800/50">
                <span className="text-[10px] text-neutral-400 font-bold mr-1 shrink-0">Miền:</span>
                {[
                  { id: 'all', label: `Tất cả (${nanoVoices.length})` },
                  { id: 'bac', label: `Bắc (${nanoVoices.filter(v => v.region === 'bac').length})` },
                  { id: 'trung', label: `Trung (${nanoVoices.filter(v => v.region === 'trung').length})` },
                  { id: 'nam', label: `Nam (${nanoVoices.filter(v => v.region === 'nam').length})` },
                ].map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setNanoRegion(r.id as any)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${
                      nanoRegion === r.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}

            <div className="p-1 space-y-1 mt-1 overflow-y-auto custom-scrollbar flex-1 max-h-[50vh]">
              {/* Nếu có giọng clone của bạn (đã tạo trong Phòng Thu), ưu tiên hiển thị gọn gàng ở đầu danh sách */}
              {customVoices.length > 0 && (
                <div className="mb-2 pb-2 border-b border-neutral-800/80">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 pt-1 pb-1 flex items-center justify-between">
                    <span>⭐ Giọng Của Bạn ({customVoices.length})</span>
                    <span className="text-[9px] text-neutral-500 font-normal">Quản lý tại Phòng Thu</span>
                  </div>
                  {customVoices.map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => handleSelectVoice(v.id)}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-start justify-between touch-manipulation active:scale-[0.98] ${
                        selectedVoice === v.id
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                          : 'hover:bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs font-bold flex items-center gap-1.5 truncate">
                          <span>⭐ {v.name}</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold">
                            CỦA BẠN
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">{v.desc}</div>
                      </div>
                      {selectedVoice === v.id && (
                        <UserCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* TAB 1: KHO 29 GIỌNG NANO */}
              {voiceTab === 'nano' && (
                <>
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 pt-1 pb-0.5 flex items-center justify-between">
                    <span>🎙️ 29 Giọng VieNeu Nano ({filteredNanoVoices.length})</span>
                    <span className="text-neutral-400 lowercase font-normal">VieNeu Engine • Miễn phí</span>
                  </div>
                  {filteredNanoVoices.map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => handleSelectVoice(v.id)}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-start justify-between touch-manipulation active:scale-[0.98] ${
                        selectedVoice === v.id
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                          : 'hover:bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs font-bold flex items-center gap-1.5 truncate">
                          {v.label}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">{v.desc}</div>
                      </div>
                      {selectedVoice === v.id && (
                        <UserCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </>
              )}

              {/* TAB 2: GIỌNG CHUẨN EDGE & GOOGLE */}
              {voiceTab === 'standard' && (
                <>
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 pt-1 pb-0.5">
                    <span>⚡ Giọng Đọc Microsoft AI & Google</span>
                  </div>
                  {standardVoices.map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => handleSelectVoice(v.id)}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-start justify-between touch-manipulation active:scale-[0.98] ${
                        selectedVoice === v.id
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                          : 'hover:bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs font-bold flex items-center gap-1.5 truncate">
                          {v.label}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">{v.desc}</div>
                      </div>
                      {selectedVoice === v.id && (
                        <UserCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </>
              )}

              {/* TAB 3: GIỌNG MICROX CLONE */}
              {voiceTab === 'microx' && (
                <>
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 pt-1 pb-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>⭐ Giọng MicroX AI Clone (Server API)</span>
                  </div>
                  {microxVoices.map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => handleSelectVoice(v.id)}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-start justify-between touch-manipulation active:scale-[0.98] ${
                        selectedVoice === v.id
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                          : 'hover:bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs font-bold flex items-center gap-1.5 truncate">
                          {v.label}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">{v.desc}</div>
                      </div>
                      {selectedVoice === v.id && (
                        <UserCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}

                  <div className="pt-2 border-t border-neutral-800 mt-2">
                    <button
                      onClick={() => {
                        setShowVoiceMenu(false);
                        setIsSettingsOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-amber-400" />
                      Cài đặt API & Quản lý giọng MicroX...
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Footer: Liên kết đến Phòng Thu LaziBook */}
            <div className="pt-2 border-t border-neutral-800 mt-1 shrink-0">
              <Link
                href="/phong-thu"
                onClick={() => setShowVoiceMenu(false)}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mở Phòng Thu (Nghe thử, Quản lý & Tạo giọng)</span>
                </div>
                <span className="text-[10px] font-black uppercase">Studio →</span>
              </Link>
            </div>
          </div>
        )}

        {/* Menu Hẹn Giờ Tắt (Sleep Timer Pop-up) */}
        {showSleepMenu && (
          <div className="absolute bottom-full mb-3 right-2 sm:right-16 w-64 bg-neutral-900 border border-neutral-700 rounded-2xl p-3 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-amber-400" />
                Hẹn giờ tắt (Ngủ ngon)
              </span>
              <button
                onClick={() => setShowSleepMenu(false)}
                className="text-neutral-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {[
                { min: 0, label: 'Tắt hẹn giờ' },
                { min: 15, label: 'Sau 15 phút' },
                { min: 30, label: 'Sau 30 phút' },
                { min: 45, label: 'Sau 45 phút' },
                { min: 60, label: 'Sau 60 phút' },
                { min: -1, label: 'Đọc hết chương này' },
              ].map((opt) => (
                <button
                  key={opt.min}
                  onClick={() => {
                    setSleepTimerMinutes(opt.min);
                    setShowSleepMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    sleepTimerMinutes === opt.min
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'hover:bg-neutral-800 text-neutral-300'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sleepTimerMinutes === opt.min && (
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Âm Thanh Nền Thư Giãn (LaziBook Ambient Audio Mixer) */}
        {showAmbientMenu && (
          <div className="absolute bottom-full mb-3 right-2 sm:right-28 w-72 bg-neutral-900 border border-neutral-700 rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800 mb-2.5">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-sky-400" />
                Âm Nền Thư Giãn (LaziBook)
              </span>
              <button
                onClick={() => setShowAmbientMenu(false)}
                className="text-neutral-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Danh sách các chế độ âm nền */}
            <div className="space-y-1.5 mb-3">
              {AMBIENT_SOUND_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setAmbientType(opt.id);
                    if (opt.id === 'none') {
                      ambientAudioEngine.stop();
                    } else if (isPlaying) {
                      ambientAudioEngine.setSound(opt.id);
                    }
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    ambientType === opt.id
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                      : 'hover:bg-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{opt.icon}</span>
                    <div>
                      <div className="font-bold">{opt.label}</div>
                      <div className="text-[10px] text-neutral-400 font-normal">{opt.desc}</div>
                    </div>
                  </div>
                  {ambientType === opt.id && (
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                  )}
                </button>
              ))}
            </div>

            {/* Thanh điều chỉnh âm lượng âm nền */}
            {ambientType !== 'none' && (
              <div className="pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Âm lượng nền</span>
                  <span className="font-bold text-sky-400">{Math.round(ambientVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
              </div>
            )}
          </div>
        )}

        {/* Menu Tốc Độ Đọc (Speed Pop-up - Cho phép chọn trực tiếp 1-click) */}
        {showSpeedMenu && (
          <div className="absolute bottom-full mb-3 right-2 sm:right-28 w-56 bg-neutral-900 border border-neutral-700 rounded-2xl p-2.5 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2 px-1">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                Chọn tốc độ đọc
              </span>
              <button
                onClick={() => setShowSpeedMenu(false)}
                className="text-neutral-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {SPEED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelectSpeed(opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    playbackRate === opt.value
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'hover:bg-neutral-800 text-neutral-300'
                  }`}
                >
                  <span>{opt.label}</span>
                  {playbackRate === opt.value && (
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Thanh tiến trình đọc siêu mảnh */}
        <div className="w-full bg-neutral-800/80 h-1 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* HÀNG 1 (TIỆN ÍCH & THÔNG TIN): TÊN GIỌNG ĐỌC + TIẾN ĐỘ + 4 NÚT TIỆN ÍCH */}
        <div className="flex items-center justify-between gap-1.5 pb-2 mb-1.5 border-b border-white/10">
          {/* Nút Chọn Giọng Đọc (To rõ, dễ chạm) */}
          <button
            onClick={() => setShowVoiceMenu(!showVoiceMenu)}
            className="h-8 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-left flex items-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer"
            title="Chạm để đổi giọng đọc ngay"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
            <div className="flex items-center gap-1 leading-none">
              <span className="text-[10px] text-neutral-400 font-medium">Giọng:</span>
              <span className="text-xs font-bold text-amber-300 truncate max-w-[95px] sm:max-w-[140px]">
                {currentVoiceObj.name}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
          </button>

          {/* Tiến độ câu đọc */}
          <div className="flex items-center gap-1 text-xs font-bold text-neutral-300 truncate">
            <span>{activeSentenceIndex + 1}/{sentences.length}</span>
            {bufferedCount > 0 && (
              <span
                className="inline-flex items-center text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1 py-0.2 rounded-full"
                title={`Đã đệm sẵn ${bufferedCount} câu tiếp theo`}
              >
                +{bufferedCount}
              </span>
            )}
          </div>

          {/* Các tiện ích phụ (Icon tròn thoáng, dễ chạm) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Tốc độ đọc */}
            <button
              onClick={() => {
                setShowSpeedMenu(!showSpeedMenu);
                setShowAmbientMenu(false);
                setShowSleepMenu(false);
                setShowVoiceMenu(false);
              }}
              className={`h-8 px-2 rounded-xl text-xs font-bold transition flex items-center gap-0.5 cursor-pointer ${
                showSpeedMenu
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 text-neutral-300'
              }`}
              title="Tốc độ đọc"
            >
              <Gauge className="w-3 h-3 text-amber-400" />
              <span>{playbackRate}x</span>
            </button>

            {/* Âm nền */}
            <button
              onClick={() => {
                setShowAmbientMenu(!showAmbientMenu);
                setShowSleepMenu(false);
                setShowVoiceMenu(false);
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${
                ambientType !== 'none'
                  ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40'
                  : 'bg-white/10 hover:bg-white/15 text-neutral-400 hover:text-white'
              }`}
              title="Âm thanh nền (Mưa, Sóng biển...)"
            >
              <CloudRain className="w-3.5 h-3.5" />
            </button>

            {/* Hẹn giờ */}
            <button
              onClick={() => {
                setShowSleepMenu(!showSleepMenu);
                setShowAmbientMenu(false);
                setShowVoiceMenu(false);
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${
                sleepTimerMinutes !== 0
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 animate-pulse'
                  : 'bg-white/10 hover:bg-white/15 text-neutral-400 hover:text-white'
              }`}
              title="Hẹn giờ ngủ"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>

            {/* Tải trước cả chương */}
            <button
              onClick={() => {
                setShowPrecacheModal(true);
                handleCheckPrecacheStatus();
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${
                precacheStatus === 'running'
                  ? 'bg-amber-500 text-neutral-950 animate-pulse font-black'
                  : precacheStatus === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/10 hover:bg-white/15 text-neutral-400 hover:text-amber-400'
              }`}
              title="Tải trước audio cả chương (0ms)"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>

            {/* Nút Đóng */}
            <button
              onClick={() => {
                handleStop();
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 flex items-center justify-center transition cursor-pointer"
              title="Đóng thanh nghe"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* HÀNG 2 (ĐIỀU KHIỂN CHÍNH - BỰ, CÂN ĐỐI, CHẠM CỰC SƯỚNG TRÊN MOBILE): THUMB ZONE */}
        <div className="flex items-center justify-between gap-2 h-12">
          {/* Nút bên trái: Bật/Tắt Tự Chuyển Chương */}
          <button
            onClick={toggleAutoNext}
            className={`h-10 px-2.5 sm:px-3 rounded-2xl text-xs font-bold transition active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0 ${
              autoNext
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-white/10 hover:bg-white/15 text-neutral-400'
            }`}
            title={autoNext ? 'Tự chuyển chương: BẬT' : 'Tự chuyển chương: TẮT'}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${autoNext ? 'text-amber-400' : 'text-neutral-500'}`} />
            <span className="text-[11px] font-semibold">{autoNext ? 'Tự Next' : 'Dừng'}</span>
          </button>

          {/* CỤM ĐIỀU KHIỂN PHÁT Ở CHÍNH GIỮA (TO BỰ, NỔI BẬT NHẤT) */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-1">
            {/* Nút Câu Trước (44x44px - Chuẩn cảm ứng ngón cái) */}
            <button
              onClick={handlePrev}
              disabled={activeSentenceIndex <= 0}
              className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/15 disabled:opacity-20 flex items-center justify-center text-white transition active:scale-90 cursor-pointer shadow-sm shrink-0"
              title="Câu trước"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* NÚT PHÁT / DỪNG CHÍNH (NỔI BẬT: RỘNG 110px, CAO 44px, GRADIENT RỰC RỠ) */}
            <button
              onClick={handleTogglePlay}
              className="h-11 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl shadow-amber-500/35 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer font-black text-sm min-w-[110px] shrink-0"
              title={isPlaying ? 'Tạm dừng' : `Phát giọng đọc ${currentVoiceObj.name}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span className="text-xs font-black tracking-wide">Đang nạp...</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span className="text-xs font-black tracking-wide">Dừng</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                  <span className="text-xs font-black tracking-wide">Nghe</span>
                </>
              )}
            </button>

            {/* Nút Câu Kế Tiếp (44x44px - Chuẩn cảm ứng ngón cái) */}
            <button
              onClick={handleNext}
              disabled={activeSentenceIndex >= sentences.length - 1}
              className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/15 disabled:opacity-20 flex items-center justify-center text-white transition active:scale-90 cursor-pointer shadow-sm shrink-0"
              title="Câu tiếp theo"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Nút bên phải: Mute / Bật tiếng */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 ${
              isMuted
                ? 'bg-rose-500/25 text-rose-400 border border-rose-500/40'
                : 'bg-white/10 hover:bg-white/15 text-neutral-400 hover:text-white'
            }`}
            title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Modal Tải Trước Audio Cả Chương (Pre-generate Audio / Offline) */}
      {showPrecacheModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl text-white relative animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Tải trước Audio cả chương</h3>
                  <p className="text-[10px] text-neutral-400">Gen sẵn âm thanh • Nghe 0ms • Tiết kiệm 4G</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrecacheModal(false)}
                className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thông tin chương & giọng đọc */}
            <div className="bg-neutral-800/60 border border-white/5 rounded-2xl p-3.5 mb-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Chương:</span>
                <span className="font-bold text-neutral-200 truncate max-w-[200px]">{chapterTitle}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Giọng đọc:</span>
                <span className="font-black text-amber-300">{currentVoiceObj.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Dung lượng ước tính:</span>
                <span className="font-bold text-neutral-200">
                  {sentences.length} câu (~{(sentences.length * 0.03).toFixed(1)} MB)
                </span>
              </div>
            </div>

            {/* Trạng thái tiến trình */}
            <div className="mb-5 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-neutral-300">
                  {precacheStatus === 'checking' && 'Đang kiểm tra kho lưu trữ...'}
                  {precacheStatus === 'running' && 'Đang gen trước âm thanh...'}
                  {precacheStatus === 'paused' && 'Đang tạm dừng'}
                  {precacheStatus === 'completed' && '✅ Đã sẵn sàng 100%!'}
                  {precacheStatus === 'idle' && (precacheProgress.cached > 0 ? `Đã có sẵn ${precacheProgress.cached}/${sentences.length} câu` : 'Sẵn sàng tải trước')}
                </span>
                <span className="text-amber-400">
                  {precacheProgress.cached} / {precacheProgress.total || sentences.length} câu
                  {precacheProgress.total > 0 && ` (${Math.round((precacheProgress.cached / precacheProgress.total) * 100)}%)`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    precacheStatus === 'completed'
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round(((precacheProgress.cached || 0) / (precacheProgress.total || sentences.length || 1)) * 100))}%`,
                  }}
                />
              </div>

              {/* Câu đang xử lý */}
              {precacheStatus === 'running' && precacheProgress.text && (
                <p className="text-[11px] text-neutral-400 italic line-clamp-1 pt-1">
                  Đang xử lý: &quot;{precacheProgress.text}&quot;
                </p>
              )}
            </div>

            {/* Các nút điều khiển */}
            <div className="flex items-center gap-2">
              {precacheStatus === 'completed' ? (
                <>
                  <button
                    onClick={() => {
                      setShowPrecacheModal(false);
                      if (!isPlaying) handleTogglePlay();
                    }}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Bắt đầu nghe ngay (0ms)</span>
                  </button>
                  <button
                    onClick={() => setShowPrecacheModal(false)}
                    className="py-3 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition"
                  >
                    Đóng
                  </button>
                </>
              ) : precacheStatus === 'running' ? (
                <button
                  onClick={handleStopPrecache}
                  className="w-full py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-rose-500/20 active:scale-95"
                >
                  <Pause className="w-4 h-4" />
                  <span>Tạm dừng tải</span>
                </button>
              ) : (
                <button
                  onClick={handleStartPrecache}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-xl shadow-amber-500/30 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>
                    {precacheProgress.cached > 0 ? 'Tiếp tục tải nốt các câu còn lại' : 'Bắt đầu tải trước cả chương'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Cài đặt MicroX API & Giọng đọc */}
      <MicroXSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedVoice={selectedVoice}
        onSelectVoice={(vId) => {
          handleSelectVoice(vId);
        }}
        customApiKey={customApiKey}
        onSaveApiKey={handleSaveApiKey}
        creativity={creativity}
        onSaveCreativity={handleSaveCreativity}
        customVoices={customVoices}
        onAddCustomVoice={handleAddCustomVoice}
      />
    </div>
  );
}
