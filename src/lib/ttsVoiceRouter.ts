/**
 * TTS Voice Type System & Routing
 * Đảm bảo phân loại chặt chẽ từng loại giọng đọc bằng discriminated union.
 * Phạm vi: edge | clone | microx
 * Tuyệt đối không tự ý lùi về Edge khi gặp ID lạ hoặc sai regex - Bắt buộc ném lỗi InvalidVoiceError (HTTP 400).
 */

import audioThresholdsJson from '@/data/audio_thresholds.json';

declare const RefIdBrand: unique symbol;
export type RefId = string & { readonly [RefIdBrand]: true };

export type Voice =
  | { kind: 'edge'; edgeVoice: string; pitch?: string; rate?: string }
  | { kind: 'clone'; refId: RefId }
  | { kind: 'microx'; voiceId: string };

export const REF_ID_REGEX = /^[a-z0-9_-]{8,40}$/;
export const SSML_PITCH_RATE_REGEX = /^[+-]\d{1,3}%$/;

// Danh sách Whitelist giọng MicroX cho phép (Bao gồm giọng mặc định Duy Onyx)
export const ALLOWED_MICROX_VOICE_IDS = new Set([
  'f1f893a090c286822a23ac2f', // Duy Onyx (Mặc định)
  '717f9e7c4a371d668b7dd242', // Nguyễn Ngọc Ngạn
  'e347bfc946cc9232466347ca', // Hà Giang
  'bc521fe706b858344a590567', // Vincente Toàn
  '42a7dc8e1d41998bf7aa5d7e', // Thúy Tiên
  '960b820ba17f73e1ae5a342a', // Huyền
  '58c3f1cae6744f008a5048fd', // Quang Toàn
  '4a3e1a0409e4c2bb591bf6f9', // Nhật Nam
]);

// Bộ hằng số ngưỡng kiểm chuẩn mẫu thu âm dùng chung giữa Client & Server (Single Source of Truth)
export const TTS_AUDIO_THRESHOLDS = audioThresholdsJson;

export class InvalidVoiceError extends Error {
  readonly statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'InvalidVoiceError';
    this.statusCode = statusCode;
  }
}

export function parseRefId(val: string): RefId {
  const normalized = val.trim().toLowerCase();
  if (!REF_ID_REGEX.test(normalized)) {
    throw new InvalidVoiceError(
      `Mã refId '${val}' không hợp lệ! Bắt buộc khớp biểu thức ^[a-z0-9_-]{8,40}$ (chữ thường, số, _, -, độ dài 8-40 ký tự).`
    );
  }
  return normalized as RefId;
}

function validateSsmlParam(param?: string, paramName = 'param'): string | undefined {
  if (!param) return undefined;
  const trimmed = param.trim();
  if (!SSML_PITCH_RATE_REGEX.test(trimmed)) {
    throw new InvalidVoiceError(
      `Tham số ${paramName} '${param}' không hợp lệ! Bắt buộc khớp định dạng ^[+-]\\d{1,3}% (ví dụ: +5%, -10%).`
    );
  }
  return trimmed;
}

const LEGACY_MALE_VOICES = new Set([
  'anh-khoi',
  'thien-tam-duc',
  'thai-son',
  'quoc-tuan',
  'manh-dung',
  'thien-minh',
  'pham-tuyen',
  'hai-dang',
  'duc-tri',
  'quang-son',
  'minh-duc',
  'minh-triet',
  'minh-quan',
  'tuan-kiet',
  'adam',
  'adam-bua',
  'huu-quan',
  'thanh-binh',
]);

const LEGACY_FEMALE_VOICES = new Set([
  'doan-trang',
  'ngoc-linh',
  'thuy-diem',
  'ngoc-tran',
  'truc-ly',
  'kim-thanh',
  'mai-anh',
  'my-duyen',
  'quynh-anh',
  'xuan-tien',
  'ngoc-huyen',
]);

export function resolveVoice(
  rawVoice: string | null | undefined,
  options?: { customPitch?: string; customRate?: string }
): Voice {
  if (!rawVoice || rawVoice.trim().length === 0) {
    return {
      kind: 'edge',
      edgeVoice: 'vi-VN-NamMinhNeural',
      pitch: '+0%',
      rate: '+0%',
    };
  }

  const voice = rawVoice.trim().toLowerCase();

  // 1. Giọng Clone người dùng (bắt đầu bằng c_ hoặc clone_) -> Parse kiểm tra regex nghiêm ngặt
  if (voice.startsWith('c_') || voice.startsWith('clone_')) {
    const validRefId = parseRefId(voice);
    return {
      kind: 'clone',
      refId: validRefId,
    };
  }

  // 2. Giọng MicroX Clone AI độc bản -> Kiểm tra theo Whitelist cho phép
  if (voice.startsWith('voice_') || voice.startsWith('mx_')) {
    const cleanId = voice.replace(/^mx_/, '').replace(/^voice_/, '');
    if (!ALLOWED_MICROX_VOICE_IDS.has(cleanId)) {
      throw new InvalidVoiceError(
        `Mã giọng MicroX '${voice}' không nằm trong danh sách cho phép (Whitelist).`
      );
    }
    return {
      kind: 'microx',
      voiceId: cleanId,
    };
  }

  // 3. Giọng Microsoft Edge Neural Gốc
  if (voice === 'namminh') {
    return {
      kind: 'edge',
      edgeVoice: 'vi-VN-NamMinhNeural',
      pitch: validateSsmlParam(options?.customPitch, 'pitch') || '+0%',
      rate: validateSsmlParam(options?.customRate, 'rate') || '+0%',
    };
  }

  if (voice === 'hoaimy') {
    return {
      kind: 'edge',
      edgeVoice: 'vi-VN-HoaiMyNeural',
      pitch: validateSsmlParam(options?.customPitch, 'pitch') || '+0%',
      rate: validateSsmlParam(options?.customRate, 'rate') || '+0%',
    };
  }

  // 4. Giọng Kể Chuyện Phong Cách Edge
  if (voice === 'story-male') {
    return {
      kind: 'edge',
      edgeVoice: 'vi-VN-NamMinhNeural',
      pitch: '-15%',
      rate: '-8%',
    };
  }

  if (voice === 'story-female') {
    return {
      kind: 'edge',
      edgeVoice: 'vi-VN-HoaiMyNeural',
      pitch: '-8%',
      rate: '-6%',
    };
  }

  // 5. Chuyển đổi tương thích ngược cho các ID cũ sang Edge Neural Chuẩn
  if (LEGACY_MALE_VOICES.has(voice)) {
    return {
      kind: 'edge',
      edgeVoice: 'vi-VN-NamMinhNeural',
      pitch: '+0%',
      rate: '+0%',
    };
  }

  if (LEGACY_FEMALE_VOICES.has(voice)) {
    return {
      kind: 'edge',
      edgeVoice: 'vi-VN-HoaiMyNeural',
      pitch: '+0%',
      rate: '+0%',
    };
  }

  // TUYỆT ĐỐI KHÔNG ÂM THẦM FALLBACK VỀ EDGE KHI GẶP ID LẠ: NÉM LỖI RÕ RÀNG!
  throw new InvalidVoiceError(
    `Không nhận diện được giọng đọc '${rawVoice}'. Vui lòng chọn giọng hợp lệ.`
  );
}
