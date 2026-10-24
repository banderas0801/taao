'use client';

export type AmbientSoundType = 'none' | 'rain' | 'waves' | 'campfire' | 'forest';

export interface AmbientSoundOption {
  id: AmbientSoundType;
  label: string;
  icon: string;
  desc: string;
}

export const AMBIENT_SOUND_OPTIONS: AmbientSoundOption[] = [
  { id: 'none', label: 'Tắt âm nền', icon: '🔕', desc: 'Chỉ nghe giọng đọc AI đơn thuần' },
  { id: 'rain', label: 'Mưa rơi rả rích', icon: '🌧️', desc: 'Tiếng mưa đêm thư thái, dễ ngủ' },
  { id: 'waves', label: 'Sóng biển rì rào', icon: '🌊', desc: 'Sóng biển vỗ bờ nhịp nhàng, tĩnh tâm' },
  { id: 'campfire', label: 'Lửa trại bập bùng', icon: '🔥', desc: 'Tiếng củi lách tách ấm áp' },
  { id: 'forest', label: 'Rừng đêm & côn trùng', icon: '🍃', desc: 'Gió nhẹ và tiếng dế đêm thanh bình' },
];

class ProceduralAmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentType: AmbientSoundType = 'none';
  private isRunning: boolean = false;
  private volume: number = 0.25; // 0 to 1

  // Nodes for cleanup
  private activeNodes: (AudioNode | number)[] = [];

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }

  public setSound(type: AmbientSoundType) {
    this.currentType = type;
    if (type === 'none') {
      this.stop();
    } else {
      this.play(type);
    }
  }

  public play(type?: AmbientSoundType) {
    const targetType = type || this.currentType;
    if (targetType === 'none') return;

    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.clearNodes();
    this.isRunning = true;
    this.currentType = targetType;

    switch (targetType) {
      case 'rain':
        this.startRain();
        break;
      case 'waves':
        this.startWaves();
        break;
      case 'campfire':
        this.startCampfire();
        break;
      case 'forest':
        this.startForest();
        break;
    }
  }

  public pause() {
    if (!this.isRunning || !this.ctx || !this.masterGain) return;
    this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
  }

  public resume() {
    if (this.currentType === 'none') return;
    this.initContext();
    if (!this.masterGain || !this.ctx) return;
    this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
    if (!this.isRunning) {
      this.play(this.currentType);
    }
  }

  public stop() {
    this.clearNodes();
    this.isRunning = false;
  }

  private clearNodes() {
    for (const item of this.activeNodes) {
      if (typeof item === 'number') {
        clearInterval(item);
      } else {
        try {
          (item as any).stop?.();
          item.disconnect();
        } catch (_) {}
      }
    }
    this.activeNodes = [];
  }

  // --- 1. PROCEDURAL RAIN ---
  private startRain() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.12;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.masterGain);

    whiteNoise.start();
    this.activeNodes.push(whiteNoise, filter, rainGain);
  }

  // --- 2. PROCEDURAL OCEAN WAVES ---
  private startWaves() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    // Filter modulated by LFO
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);

    // LFO for slow swells (0.1 Hz = 10s per cycle)
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const waveGain = this.ctx.createGain();
    waveGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(this.masterGain);

    lfo.start();
    source.start();
    this.activeNodes.push(source, filter, lfo, lfoGain, waveGain);
  }

  // --- 3. PROCEDURAL CAMPFIRE ---
  private startCampfire() {
    if (!this.ctx || !this.masterGain) return;

    // Rumble base
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
    }

    const baseSource = this.ctx.createBufferSource();
    baseSource.buffer = noiseBuffer;
    baseSource.loop = true;

    const baseFilter = this.ctx.createBiquadFilter();
    baseFilter.type = 'lowpass';
    baseFilter.frequency.setValueAtTime(200, this.ctx.currentTime);

    const baseGain = this.ctx.createGain();
    baseGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    baseSource.connect(baseFilter);
    baseFilter.connect(baseGain);
    baseGain.connect(this.masterGain);
    baseSource.start();

    // Crackle generator: Random intermittent bursts
    const crackleInterval = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || !this.isRunning) return;
      if (Math.random() < 0.65) {
        const pop = this.ctx.createBufferSource();
        const popBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.03), this.ctx.sampleRate);
        const popData = popBuffer.getChannelData(0);
        for (let j = 0; j < popData.length; j++) {
          popData[j] = (Math.random() * 2 - 1) * Math.exp(-j / 200);
        }
        pop.buffer = popBuffer;

        const popGain = this.ctx.createGain();
        popGain.gain.setValueAtTime(0.25 + Math.random() * 0.4, this.ctx.currentTime);

        const popFilter = this.ctx.createBiquadFilter();
        popFilter.type = 'highpass';
        popFilter.frequency.setValueAtTime(1500 + Math.random() * 2000, this.ctx.currentTime);

        pop.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(this.masterGain);

        pop.start();
      }
    }, 180);

    this.activeNodes.push(baseSource, baseFilter, baseGain, crackleInterval);
  }

  // --- 4. PROCEDURAL FOREST NIGHT & CRICKETS ---
  private startForest() {
    if (!this.ctx || !this.masterGain) return;

    // Wind whisper
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.08;
    }

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    windFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.masterGain);
    windSource.start();

    // Subtle cricket chirps
    const cricketInterval = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || !this.isRunning) return;
      if (Math.random() < 0.4) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4500 + Math.random() * 600, this.ctx.currentTime);

        const chirpGain = this.ctx.createGain();
        chirpGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        chirpGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);

        osc.connect(chirpGain);
        chirpGain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.16);
      }
    }, 450);

    this.activeNodes.push(windSource, windFilter, windGain, cricketInterval);
  }
}

export const ambientAudioEngine = new ProceduralAmbientAudioEngine();
