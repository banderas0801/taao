/**
 * Phân loại định tuyến giọng đọc theo kiến trúc Discriminated Union
 * Ngăn chặn tuyệt đối việc nhầm lẫn giữa giọng Clone (VieNeu) và giọng tiêu chuẩn (Edge-TTS)
 */

export type VoiceRoute =
  | {
      kind: 'clone';
      refId: string;
    }
  | {
      kind: 'edge';
      edgeVoice: string;
      pitch: string;
      rate: string;
    }
  | {
      kind: 'microx';
      voiceId: string;
      speed?: number;
      creativity?: number;
      apiKey?: string;
    }
  | {
      kind: 'google';
    };

/**
 * Hàm định tuyến giọng đọc chuẩn hoá (Pure Router Function)
 */
export function resolveVoiceRoute(
  rawVoice: string,
  options: {
    pitch?: string;
    rate?: string;
    gender?: string;
    speed?: number;
    creativity?: number;
    apiKey?: string;
  } = {}
): VoiceRoute {
  const voice = (rawVoice || 'hoaimy').trim();

  // 1. Phân loại Giọng Clone (bắt đầu bằng clone_)
  if (voice.startsWith('clone_')) {
    // Chỉ giữ lại chữ cái, số, gạch dưới và gạch ngang
    const cleanRefId = voice.replace(/[^a-zA-Z0-9_-]/g, '');
    return {
      kind: 'clone',
      refId: cleanRefId,
    };
  }

  // 2. Phân loại Giọng MicroX AI (bắt đầu bằng mx_ hoặc voice_)
  if (voice.startsWith('mx_') || voice.startsWith('voice_')) {
    return {
      kind: 'microx',
      voiceId: voice.replace(/^mx_/, ''),
      speed: options.speed,
      creativity: options.creativity,
      apiKey: options.apiKey,
    };
  }

  // 3. Phân loại Google TTS cứu nguy
  if (voice.toLowerCase() === 'google') {
    return { kind: 'google' };
  }

  // 4. Phân loại Giọng Edge-TTS tiêu chuẩn (Nam Minh, Hoài My, Kể Chuyện Đêm...)
  const isMale =
    options.gender === 'male' ||
    ['namminh', 'story-male', 'ngocngan-style'].includes(voice);

  let edgeVoice = isMale ? 'vi-VN-NamMinhNeural' : 'vi-VN-HoaiMyNeural';
  let pitch = options.pitch || '+0%';
  const baseSpeed = Math.max(0.5, Math.min(2.0, options.speed || 1.0));
  let ratePct = Math.round((baseSpeed - 1.0) * 100);

  if (options.rate) {
    const parsedRate = parseInt(options.rate.replace('%', ''), 10) || 0;
    ratePct += parsedRate;
  }

  if (voice === 'story-male' || voice === 'ngocngan-style') {
    edgeVoice = 'vi-VN-NamMinhNeural';
    pitch = '-15%';
    ratePct = Math.round((baseSpeed * 0.92 - 1.0) * 100);
  } else if (voice === 'story-female') {
    edgeVoice = 'vi-VN-HoaiMyNeural';
    pitch = '-8%';
    ratePct = Math.round((baseSpeed * 0.95 - 1.0) * 100);
  } else if (voice === 'young-female') {
    edgeVoice = 'vi-VN-HoaiMyNeural';
    pitch = '+8%';
    ratePct = Math.round((baseSpeed * 1.05 - 1.0) * 100);
  }

  const rateStr = `${ratePct >= 0 ? '+' : ''}${ratePct}%`;

  return {
    kind: 'edge',
    edgeVoice,
    pitch,
    rate: rateStr,
  };
}
