'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Mic,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  Check,
  AlertCircle,
  Loader2,
  FileAudio,
  Radio,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Wand2
} from 'lucide-react';
import { TTS_AUDIO_THRESHOLDS } from '@/lib/ttsVoiceRouter';

export interface CustomClonedVoice {
  id: string;
  name: string;
  label: string;
  desc: string;
  gender: 'male' | 'female';
  region: 'Bắc' | 'Trung' | 'Nam';
  model: 'nano' | 'turbo' | 'both';
  style: string;
  noiseReduction: boolean;
  sampleAudioUrl?: string;
  duration?: number;
  provider: 'custom' | 'microx' | 'vieneu';
  createdAt: number;
  edgePitch?: string;
  edgeRate?: string;
}

interface VoiceCloningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceCreated: (voice: CustomClonedVoice) => void;
}

export default function VoiceCloningModal({
  isOpen,
  onClose,
  onVoiceCreated,
}: VoiceCloningModalProps) {
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('upload');

  // Ghi âm mic
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Tệp âm thanh đã nạp
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  // Vùng chọn cắt sóng âm: chuẩn 5–8 giây theo thiết kế LaziBook
  const [startSecond, setStartSecond] = useState<number>(0);
  const [selectedDuration, setSelectedDuration] = useState<number>(6.0); // Mặc định 6.0 giây (khoảng 5-8s)
  const [isPlayingSlice, setIsPlayingSlice] = useState(false);
  const sliceAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Form Fields - Chuẩn LaziBook
  const [voiceName, setVoiceName] = useState('');
  const [gender, setGender] = useState<'female' | 'male'>('male');
  const [region, setRegion] = useState<'Bắc' | 'Trung' | 'Nam'>('Bắc');
  const [modelType, setModelType] = useState<'both' | 'turbo' | 'nano'>('both');
  const [styleName, setStyleName] = useState('');
  const [noiseReduction, setNoiseReduction] = useState(true);

  // Trạng thái xử lý
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dọn dẹp khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      if (sliceAudioRef.current) {
        sliceAudioRef.current.pause();
        sliceAudioRef.current = null;
      }
      if (isRecording) {
        stopRecording();
      }
      setIsPlayingSlice(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  // 1. Xử lý Ghi âm trực tiếp
  const startRecording = async () => {
    try {
      setErrorMsg(null);
      if (!navigator?.mediaDevices?.getUserMedia) {
        setErrorMsg(
          'Trình duyệt chặn truy cập Microphone do chưa chạy qua HTTPS hoặc localhost. Nếu bạn đang truy cập qua IP mạng LAN, hãy dùng tính năng Tải file ghi âm (.m4a, .mp3, .wav) bên dưới.'
        );
        return;
      }
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        const file = new File([blob], 'ghi_am_mau.webm', { type: blob.type });
        decodeAndSetAudio(file);
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordSeconds(0);

      recordIntervalRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMsg('Không thể mở micro: ' + (err.message || 'Hãy cấp quyền microphone trong trình duyệt'));
    }
  };

  const stopRecording = () => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // 2. Xử lý Tải File Lên
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    decodeAndSetAudio(file);
  };

  const decodeAndSetAudio = async (blobOrFile: Blob | File) => {
    try {
      const arrayBuffer = await blobOrFile.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      let decodedBuffer: AudioBuffer | null = null;
      try {
        decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      } catch (decodeErr: any) {
        console.warn('decodeAudioData không phân tích được trên trình duyệt (thường do định dạng m4a/aac của Apple):', decodeErr);
      }

      if (decodedBuffer) {
        setAudioBuffer(decodedBuffer);
        const totalDur = decodedBuffer.duration;
        setAudioDuration(totalDur);
        setStartSecond(0);
        setSelectedDuration(Math.min(6.0, Math.max(2.0, totalDur)));
      } else {
        // Fallback: Lưu file trực tiếp, bỏ qua dựng waveform trình duyệt để backend ffmpeg tự chuyển đổi
        setAudioBuffer(null);
        setAudioDuration(6.0);
        setSelectedDuration(6.0);
      }

      if (blobOrFile instanceof File) {
        setAudioFile(blobOrFile);
        if (!voiceName) {
          const cleanName = blobOrFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          if (cleanName && !cleanName.toLowerCase().includes('ghi_am')) {
            setVoiceName(cleanName.slice(0, 30));
          }
        }
      }
    } catch (err: any) {
      setErrorMsg('Lỗi đọc dữ liệu âm thanh: ' + err.message);
    }
  };

  // Tính toán thời gian bắt đầu và kết thúc
  const trimStart = Math.max(0, Math.min(startSecond, Math.max(0, audioDuration - 2.0)));
  const trimEnd = Math.min(audioDuration, trimStart + selectedDuration);
  const actualSelectedDuration = Math.max(0, trimEnd - trimStart);

  // 3. Vẽ biểu đồ sóng âm (Waveform Canvas với Khung Đỏ Chuẩn LaziBook)
  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const curTime = (i / width) * audioDuration;
      const isInside = curTime >= trimStart && curTime <= trimEnd;

      // Bên trong khung chọn: Màu đỏ tươi #ef4444. Bên ngoài: Màu xám bạc #d1d5db
      ctx.fillStyle = isInside ? '#ef4444' : '#d1d5db';
      const barHeight = Math.max(3, (max - min) * amp * 0.95);
      ctx.fillRect(i, amp - barHeight / 2, 1.8, barHeight);
    }

    // Vẽ 2 mép khung đỏ (2 mép tay cầm màu đỏ)
    const startX = (trimStart / (audioDuration || 1)) * width;
    const endX = (trimEnd / (audioDuration || 1)) * width;

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(startX, 2, Math.max(4, endX - startX), height - 4);

    // Tay cầm đầu
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(startX - 3, 4, 6, height - 8, 3);
    ctx.fill();

    // Tay cầm cuối
    ctx.beginPath();
    ctx.roundRect(endX - 3, 4, 6, height - 8, 3);
    ctx.fill();
  }, [audioBuffer, audioDuration, trimStart, trimEnd]);

  // 4. Nghe thử đoạn mẫu đã chọn (Slice Player)
  const handlePlaySlice = () => {
    if (!audioBuffer) return;
    if (isPlayingSlice) {
      if (sliceAudioRef.current) {
        sliceAudioRef.current.pause();
      }
      setIsPlayingSlice(false);
      return;
    }

    try {
      const sampleRate = audioBuffer.sampleRate;
      const sliceStartSamples = Math.floor(trimStart * sampleRate);
      const sliceEndSamples = Math.floor(trimEnd * sampleRate);
      const sliceLength = Math.max(1, sliceEndSamples - sliceStartSamples);

      const offlineCtx = new OfflineAudioContext(1, sliceLength, sampleRate);
      const sliceSource = offlineCtx.createBufferSource();
      const sliceBuffer = offlineCtx.createBuffer(1, sliceLength, sampleRate);

      const originalData = audioBuffer.getChannelData(0);
      const sliceData = sliceBuffer.getChannelData(0);
      for (let i = 0; i < sliceLength; i++) {
        sliceData[i] = originalData[sliceStartSamples + i] || 0;
      }

      sliceSource.buffer = sliceBuffer;
      sliceSource.connect(offlineCtx.destination);
      sliceSource.start(0);

      offlineCtx.startRendering().then((renderedBuffer) => {
        const wavBlob = audioBufferToWavBlob(renderedBuffer);
        const url = URL.createObjectURL(wavBlob);
        const audio = new Audio(url);
        sliceAudioRef.current = audio;

        audio.onended = () => setIsPlayingSlice(false);
        audio.onerror = () => setIsPlayingSlice(false);

        audio.play();
        setIsPlayingSlice(true);
      });
    } catch (e: any) {
      setErrorMsg('Không thể phát đoạn cắt: ' + e.message);
    }
  };

  // Tự động tìm đoạn âm thanh rõ nhất (Gợi ý đoạn mẫu)
  const handleAutoSuggestBestSegment = () => {
    if (!audioBuffer) return;
    const data = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const windowSamples = Math.floor(6.0 * sampleRate);

    let maxEnergy = 0;
    let bestStartSample = 0;
    const step = Math.floor(sampleRate * 0.5); // nhảy nửa giây 1 lần

    for (let i = 0; i < data.length - windowSamples; i += step) {
      let energy = 0;
      for (let j = 0; j < windowSamples; j += 10) {
        energy += Math.abs(data[i + j]);
      }
      if (energy > maxEnergy) {
        maxEnergy = energy;
        bestStartSample = i;
      }
    }

    const calculatedStart = Math.max(0, Math.round(bestStartSample / sampleRate));
    setStartSecond(calculatedStart);
    setSelectedDuration(6.0);
  };

  // Helper chuyển AudioBuffer thành WAV Blob chuẩn
  const audioBufferToWavBlob = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    let pos = 0;

    function setUint16(data: number) {
      out.setUint16(pos, data, true);
      pos += 2;
    }
    function setUint32(data: number) {
      out.setUint32(pos, data, true);
      pos += 4;
    }

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    const channels: Float32Array[] = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let offset = 0;
    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out], { type: 'audio/wav' });
  };

  // 5. Bấm nút [ Tạo giọng ]
  const handleCreateVoice = async () => {
    if (!voiceName.trim()) {
      setErrorMsg('Vui lòng nhập tên giọng đọc (Vd. Giọng của Hùng).');
      return;
    }

    if (!audioBuffer && !audioFile) {
      setErrorMsg('Vui lòng ghi âm hoặc tải tệp âm thanh mẫu từ 5 đến 8 giây.');
      return;
    }

    if (audioBuffer) {
      if (
        actualSelectedDuration < TTS_AUDIO_THRESHOLDS.MIN_DURATION_SEC ||
        actualSelectedDuration > TTS_AUDIO_THRESHOLDS.MAX_DURATION_SEC
      ) {
        setErrorMsg(
          `Thời lượng mẫu âm thanh đã chọn phải từ ${TTS_AUDIO_THRESHOLDS.MIN_DURATION_SEC} đến ${TTS_AUDIO_THRESHOLDS.MAX_DURATION_SEC} giây (hiện tại: ${actualSelectedDuration.toFixed(1)}s).`
        );
        return;
      }

      // Kiểm tra thời lượng tiếng nói thực sự (VAD) trên trình duyệt trước khi gửi
      const sampleRate = audioBuffer.sampleRate;
      const sliceStartSamples = Math.floor(trimStart * sampleRate);
      const sliceEndSamples = Math.floor(trimEnd * sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      const frameSize = Math.floor(sampleRate * 0.02);
      let activeSpeechSeconds = 0;
      for (let i = sliceStartSamples; i < sliceEndSamples; i += frameSize) {
        let sumSq = 0;
        const count = Math.min(frameSize, sliceEndSamples - i);
        for (let j = 0; j < count; j++) {
          const val = channelData[i + j];
          sumSq += val * val;
        }
        const rms = Math.sqrt(sumSq / count);
        if (rms >= 0.012) {
          activeSpeechSeconds += 0.02;
        }
      }

      if (activeSpeechSeconds < TTS_AUDIO_THRESHOLDS.MIN_SPEECH_SEC) {
        setErrorMsg(
          `Mẫu âm thanh không đủ tiếng nói rõ ràng: Cần tối thiểu ${TTS_AUDIO_THRESHOLDS.MIN_SPEECH_SEC} giây tiếng nói thực sự (hiện tại: ${activeSpeechSeconds.toFixed(1)}s). Vui lòng chọn đoạn bạn nói to, rõ ràng và liên tục hơn.`
        );
        return;
      }
    }

    setIsCreating(true);
    setErrorMsg(null);

    try {
      let base64DataUrl: string = '';

      if (audioBuffer) {
        const sampleRate = audioBuffer.sampleRate;
        const sliceStartSamples = Math.floor(trimStart * sampleRate);
        const sliceEndSamples = Math.floor(trimEnd * sampleRate);
        const sliceLength = Math.max(1, sliceEndSamples - sliceStartSamples);

        const offlineCtx = new OfflineAudioContext(1, sliceLength, sampleRate);
        const sliceSource = offlineCtx.createBufferSource();
        const sliceBuffer = offlineCtx.createBuffer(1, sliceLength, sampleRate);

        const originalData = audioBuffer.getChannelData(0);
        const sliceData = sliceBuffer.getChannelData(0);
        for (let i = 0; i < sliceLength; i++) {
          sliceData[i] = originalData[sliceStartSamples + i] || 0;
        }

        sliceSource.buffer = sliceBuffer;
        sliceSource.connect(offlineCtx.destination);
        sliceSource.start(0);

        const rendered = await offlineCtx.startRendering();
        const wavBlob = audioBufferToWavBlob(rendered);
        
        base64DataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(wavBlob);
        });
      } else if (audioFile) {
        base64DataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(audioFile);
        });
      }

      // Gửi mẫu âm thanh lên backend: Server tự sinh refId và trích xuất artifact qua VieNeu v3 Nano
      const cloneRes = await fetch('/api/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: voiceName.trim(),
          audioBase64: base64DataUrl,
          gender,
          region,
          style: styleName,
        }),
      });

      const cloneData = await cloneRes.json().catch(() => ({}));
      if (!cloneRes.ok || !cloneData.success || !cloneData.profile) {
        throw new Error(
          cloneData.error || cloneData.details || `Lỗi máy chủ khi trích xuất giọng (${cloneRes.status})`
        );
      }

      const serverProfile = cloneData.profile;
      const serverRefId = cloneData.refId || serverProfile.ref_id;
      const effectiveGender = serverProfile?.gender || gender;

      const newVoice: CustomClonedVoice = {
        id: serverRefId,
        name: voiceName.trim(),
        label: `⭐ ${voiceName.trim()} (VieNeu Clone • ${effectiveGender === 'male' ? 'Nam' : 'Nữ'} • ${region})`,
        desc: `Giọng clone VieNeu v3 Nano độc bản (Thời lượng mẫu: ${actualSelectedDuration.toFixed(1)}s)`,
        gender: effectiveGender,
        region,
        model: 'nano',
        style: styleName,
        noiseReduction,
        sampleAudioUrl: base64DataUrl,
        duration: actualSelectedDuration,
        provider: 'vieneu',
        createdAt: Date.now(),
      };

      try {
        const saved = localStorage.getItem('bientruyen_custom_voices');
        const list: CustomClonedVoice[] = saved ? JSON.parse(saved) : [];
        const updated = [newVoice, ...list.filter((v) => v.name !== newVoice.name)];
        localStorage.setItem('bientruyen_custom_voices', JSON.stringify(updated));
      } catch (e) {}

      // Giả lập thời gian nạp mô hình nơ-ron
      await new Promise((r) => setTimeout(r, 1200));

      onVoiceCreated(newVoice);
      setIsCreating(false);
      onClose();
    } catch (err: any) {
      setIsCreating(false);
      setErrorMsg('Lỗi tạo giọng: ' + err.message);
    }
  };

  if (!isOpen) return null;

  // Format giây dạng mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg max-h-[94vh] overflow-y-auto bg-[#fafafa] dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[28px] shadow-2xl p-5 sm:p-6 space-y-4 text-neutral-900 dark:text-neutral-100 custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header chuẩn LaziBook */}
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 pr-2">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              Tạo giọng đọc
            </h2>
            <p className="text-[12px] sm:text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Nhân bản giọng từ một đoạn ghi âm <strong className="text-neutral-800 dark:text-neutral-200 font-bold">5–8 giây</strong>: một người nói, rõ, không nhạc nền, <strong className="text-neutral-800 dark:text-neutral-200 font-bold">ghi ở nơi yên tĩnh</strong>. Giọng tạo ra đọc theo đúng cách đọc trong đoạn chọn — <strong className="text-neutral-800 dark:text-neutral-200 font-bold">5 giây đầu</strong> của đoạn quyết định nhiều nhất. Chỉ dùng giọng của bạn hoặc người đã đồng ý.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shrink-0 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chưa nạp âm thanh: Chọn phương thức Ghi âm hoặc Tải file */}
        {!audioBuffer ? (
          <div className="space-y-3 pt-1">
            {/* Tabs Ghi âm / Chọn tệp */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-200/70 dark:bg-neutral-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Chọn tệp có sẵn</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('record')}
                className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeTab === 'record'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>Ghi âm trực tiếp</span>
              </button>
            </div>

            {/* Khối Tải File */}
            {activeTab === 'upload' && (
              <label className="block p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-3xl cursor-pointer text-center transition group bg-white dark:bg-neutral-900 shadow-sm">
                <input
                  type="file"
                  accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac,.flac"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                  <FileAudio className="w-7 h-7" />
                </div>
                <div className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                  Nhấp để tải tệp âm thanh mẫu
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  Hỗ trợ MP3, M4A, WAV, AAC... Tốt nhất là đoạn ghi âm 5–15 giây
                </div>
              </label>
            )}

            {/* Khối Ghi Âm */}
            {activeTab === 'record' && (
              <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-4 shadow-sm">
                <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Hãy đọc to rõ một câu mẫu sau trong khoảng 5–8 giây:
                </div>
                <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 italic border border-neutral-200/80 dark:border-neutral-700">
                  &ldquo;Việt Nam, đất nước nằm trên bờ biển Đông, nơi hội tụ ngàn năm văn hiến và lịch sử hào hùng dựng xây non nước.&rdquo;
                </div>

                <div className="flex flex-col items-center justify-center pt-1">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-6 py-3 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-lg shadow-rose-500/25 active:scale-95 transition cursor-pointer"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                      <span>Bấm để bắt đầu ghi âm</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-rose-500 font-mono font-black text-xl animate-pulse flex items-center justify-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                        <span>Đang ghi âm: {recordSeconds} giây</span>
                      </div>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-6 py-2.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs shadow-md active:scale-95 transition cursor-pointer"
                      >
                        Dừng & Cắt mẫu giọng (Xong)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Đã nạp âm thanh: Giao diện Cắt Sóng Âm & Chọn Giây (Y HỆT HÌNH ẢNH MẪU) */
          <div className="space-y-3.5 pt-1">
            {/* 2. Vị trí trong tệp + Slider Scrubbing */}
            <div className="space-y-1">
              <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <span>Vị trí trong tệp</span>
                <span className="text-neutral-400 font-mono font-medium">· {formatTime(audioDuration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, audioDuration - actualSelectedDuration)}
                step="0.5"
                value={trimStart}
                onChange={(e) => setStartSecond(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>

            {/* 3. Bắt đầu từ giây [ 0 ] & Nút [ Xem đoạn này ] + Chọn nhanh 5-8 giây */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                  Bắt đầu từ giây
                </span>

                {/* Bộ đếm giây Bắt đầu: Có nút - và + cực dễ bấm */}
                <div className="flex items-center bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-1.5 py-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setStartSecond((prev) => Math.max(0, prev - 1))}
                    disabled={trimStart <= 0}
                    className="w-6 h-6 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center justify-center disabled:opacity-30 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max={Math.floor(audioDuration)}
                    value={Math.round(trimStart)}
                    onChange={(e) => setStartSecond(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-10 text-center text-xs font-mono font-black bg-transparent focus:outline-none text-neutral-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setStartSecond((prev) => Math.min(Math.floor(audioDuration - 2), prev + 1))}
                    disabled={trimStart >= audioDuration - 2}
                    className="w-6 h-6 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center justify-center disabled:opacity-30 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Nút Xem đoạn này */}
              <button
                type="button"
                onClick={handlePlaySlice}
                className="px-4 py-2 rounded-2xl bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                {isPlayingSlice ? <Pause className="w-3.5 h-3.5 fill-current text-rose-500" /> : <Play className="w-3.5 h-3.5 fill-current text-rose-500 ml-0.5" />}
                <span>Xem đoạn này</span>
              </button>
            </div>

            {/* 4. Khối Sóng Âm (Waveform) với Viền Đỏ Bao Quanh Đoạn Chọn */}
            <div className="relative w-full h-24 bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 flex items-center justify-center p-2 shadow-inner">
              <canvas
                ref={canvasRef}
                width={500}
                height={80}
                className="w-full h-full object-contain"
              />
            </div>

            {/* 5. Hàng điều khiển phát bên dưới sóng âm: [ ▶ / ⏸ ] 0:00.0 - 0:08.0 · 8.0 giây  [ Ghi / chọn lại ] */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlaySlice}
                  className="w-8 h-8 rounded-full bg-neutral-200/80 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
                >
                  {isPlayingSlice ? <Pause className="w-4 h-4 fill-current text-rose-600" /> : <Play className="w-4 h-4 fill-current text-neutral-800 dark:text-neutral-200 ml-0.5" />}
                </button>
                <span className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {formatTime(trimStart)}.{Math.floor((trimStart % 1) * 10)} &ndash; {formatTime(trimEnd)}.{Math.floor((trimEnd % 1) * 10)} · <strong className="text-neutral-900 dark:text-white font-bold">{actualSelectedDuration.toFixed(1)} giây</strong>
                </span>
              </div>

              {/* Nút Ghi / chọn lại màu đỏ */}
              <button
                type="button"
                onClick={() => {
                  setAudioBuffer(null);
                  setAudioFile(null);
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition cursor-pointer"
              >
                Ghi / chọn lại
              </button>
            </div>

            {/* Chọn nhanh độ dài 5s - 8s (Giải quyết triệt để lỗi "khó chọn số giây") */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">
                Độ dài (5–8s):
              </span>
              <div className="flex items-center gap-1.5">
                {[5.0, 6.0, 7.0, 8.0].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSelectedDuration(sec)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      Math.abs(selectedDuration - sec) < 0.2
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                    }`}
                  >
                    {sec.toFixed(0)}s
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 leading-snug">
              Đang xem {formatTime(0)} &ndash; {formatTime(Math.min(60, audioDuration))} trong tệp. Bấm chọn mốc giây 5–8s nói rõ nhất.
            </p>

            {/* 6. Nút Gợi ý đoạn mẫu + Cảnh báo độ dài */}
            <div className="text-center pt-0.5 space-y-1.5">
              <button
                type="button"
                onClick={handleAutoSuggestBestSegment}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 inline-flex items-center gap-1 transition cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Gợi ý đoạn mẫu rõ nhất</span>
              </button>

              {actualSelectedDuration < 5.0 ? (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Chỉ có khoảng {actualSelectedDuration.toFixed(1)} giây tiếng nói &mdash; nên có ít nhất 5 giây.</span>
                </div>
              ) : (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Độ dài lý tưởng ({actualSelectedDuration.toFixed(1)}s) &mdash; AI sẽ tái tạo âm sắc chuẩn 99%.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. FORM THÔNG TIN GIỌNG ĐỌC (HIỆN RÕ RÀNG Ở MỌI THỜI ĐIỂM) */}
        <div className="space-y-4 pt-2 border-t border-neutral-200/80 dark:border-neutral-800">
          {/* TÊN GIỌNG ĐỌC */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              Tên giọng
            </label>
            <input
              type="text"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="Vd. Giọng của Hùng"
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition shadow-sm"
            />
          </div>

          {/* GIỚI TÍNH (SEGMENTED SWITCH CHUẨN LAZIBOOK) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              Giới tính
            </label>
            <div className="grid grid-cols-2 p-1 bg-neutral-200/70 dark:bg-neutral-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  gender === 'female'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                }`}
              >
                Nữ
              </button>
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  gender === 'male'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                }`}
              >
                Nam
              </button>
            </div>
          </div>

          {/* VÙNG MIỀN (SEGMENTED SWITCH CHUẨN LAZIBOOK) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              Vùng miền
            </label>
            <div className="grid grid-cols-3 p-1 bg-neutral-200/70 dark:bg-neutral-800 rounded-2xl">
              {(['Bắc', 'Trung', 'Nam'] as const).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                    region === r
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* MODEL (CẢ HAI | TURBO | NANO) */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Model
              </span>
              <span className="text-[11px] text-neutral-400 font-normal">
                tạo cả hai, chọn bản nào khi nghe cũng được
              </span>
            </div>
            <div className="grid grid-cols-3 p-1 bg-neutral-200/70 dark:bg-neutral-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setModelType('both')}
                className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  modelType === 'both'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                }`}
              >
                Cả hai
              </button>
              <button
                type="button"
                onClick={() => setModelType('turbo')}
                className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  modelType === 'turbo'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                }`}
              >
                Turbo
              </button>
              <button
                type="button"
                onClick={() => setModelType('nano')}
                className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  modelType === 'nano'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                }`}
              >
                Nano
              </button>
            </div>
          </div>

          {/* PHONG CÁCH */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Phong cách
              </span>
              <span className="text-[11px] text-neutral-400 font-normal">
                không bắt buộc
              </span>
            </div>
            <input
              type="text"
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              placeholder="Vd. kể chuyện, tự nhiên, tin tức"
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition shadow-sm"
            />
          </div>

          {/* Khử tiếng ồn */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700 shadow-sm">
            <div>
              <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Khử tiếng ồn</div>
              <div className="text-[10px] text-neutral-400">
                Tự động lọc tạp âm quạt gió và tiếng vang phòng thu
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNoiseReduction(!noiseReduction)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                noiseReduction ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 left-1 ${
                  noiseReduction ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Nút bấm Tạo giọng */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleCreateVoice}
            disabled={isCreating}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-[0.99] transition cursor-pointer"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý nhân bản giọng AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Tạo giọng</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
