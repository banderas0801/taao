import { NextRequest, NextResponse } from 'next/server';
import { getMicroXAccount, getMicroXVoices } from '@/lib/microxTts';
import { VIENEU_PRESET_VOICES } from '@/data/voices';

// 11 Giọng VieNeu v3 Nano chính thức
const VIENEU_VOICES_CURATED = VIENEU_PRESET_VOICES.map((v) => ({
  id: v.id,
  name: v.name,
  label: `${v.gender === 'male' ? '🎙️' : '🌸'} ${v.name} (VieNeu ${v.regionLabel})`,
  desc: v.tagline,
  gender: v.gender,
  provider: 'vieneu',
}));

// Danh sách giọng đọc tuyển chọn chuyên đọc truyện hay nhất
export const CURATED_VOICES = [
  ...VIENEU_VOICES_CURATED,
  {
    id: 'voice_717f9e7c4a371d668b7dd242',
    name: 'Ngọc Ngạn',
    label: '⭐ Ngọc Ngạn (MicroX Truyện)',
    desc: 'Giọng đọc nam huyền thoại, ngữ điệu truyền cảm, lôi cuốn',
    gender: 'male',
    provider: 'microx',
    previewUrl: 'https://www.microx.app/api/v1/voices/voice_717f9e7c4a371d668b7dd242/preview'
  },
  {
    id: 'voice_e347bfc946cc9232466347ca',
    name: 'Hà Giang',
    label: '⭐ Hà Giang (MicroX Nữ Bắc)',
    desc: 'Giọng nữ Bắc ngọt ngào, rõ ràng, cảm xúc tự nhiên',
    gender: 'female',
    provider: 'microx',
    previewUrl: 'https://www.microx.app/api/v1/voices/voice_e347bfc946cc9232466347ca/preview'
  },
  {
    id: 'voice_bc521fe706b858344a590567',
    name: 'Vincente Toàn',
    label: '⭐ Vincente Toàn (MicroX Nam Bắc)',
    desc: 'Giọng nam Bắc kể chuyện sâu lắng, ấm áp',
    gender: 'male',
    provider: 'microx',
    previewUrl: 'https://www.microx.app/api/v1/voices/voice_bc521fe706b858344a590567/preview'
  },
  {
    id: 'voice_42a7dc8e1d41998bf7aa5d7e',
    name: 'Thúy Tiên',
    label: '⭐ Thúy Tiên (MicroX Nữ Bắc)',
    desc: 'Giọng đọc văn học truyền cảm, nhịp điệu chậm rãi',
    gender: 'female',
    provider: 'microx',
    previewUrl: 'https://www.microx.app/api/v1/voices/voice_42a7dc8e1d41998bf7aa5d7e/preview'
  },
  {
    id: 'voice_960b820ba17f73e1ae5a342a',
    name: 'Huyền',
    label: '⭐ Huyền (MicroX Nữ Nam)',
    desc: 'Giọng nữ Nam bộ dịu dàng, trầm tĩnh, xúc cảm nhẹ nhàng',
    gender: 'female',
    provider: 'microx',
    previewUrl: 'https://www.microx.app/api/v1/voices/voice_960b820ba17f73e1ae5a342a/preview'
  },
  {
    id: 'voice_58c3f1cae6744f008a5048fd',
    name: 'Quang Toàn',
    label: '⭐ Quang Toàn (MicroX Nam Nam)',
    desc: 'Giọng nam miền Nam trầm ấm, vang, dày dặn',
    gender: 'male',
    provider: 'microx',
    previewUrl: 'https://www.microx.app/api/v1/voices/voice_58c3f1cae6744f008a5048fd/preview'
  },
  {
    id: 'voice_4a3e1a0409e4c2bb591bf6f9',
    name: 'Nhật Nam',
    label: '⭐ Nhật Nam (MicroX Nam Bắc)',
    desc: 'Tương tác tự nhiên, kể chuyện đời thường và ngôn tình',
    gender: 'male',
    provider: 'microx',
    previewUrl: 'https://www.microx.app/api/v1/voices/voice_4a3e1a0409e4c2bb591bf6f9/preview'
  },
  {
    id: 'hoaimy',
    name: 'Hoài My',
    label: '🌸 Hoài My (Nữ AI Miễn Phí)',
    desc: 'Giọng đọc nữ Bắc Microsoft AI chuẩn truyền cảm (Miễn phí)',
    gender: 'female',
    provider: 'edge'
  },
  {
    id: 'namminh',
    name: 'Nam Minh',
    label: '🎙️ Nam Minh (Nam AI Miễn Phí)',
    desc: 'Giọng đọc nam Bắc Microsoft AI trầm ấm (Miễn phí)',
    gender: 'male',
    provider: 'edge'
  },
  {
    id: 'google',
    name: 'Google',
    label: '⚡ Google Tiếng Việt (Miễn Phí)',
    desc: 'Giọng đọc chuẩn Google Tiếng Việt tốc độ cao',
    gender: 'female',
    provider: 'google'
  }
];

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search');
    const category = req.nextUrl.searchParams.get('category');
    const apiKey = req.nextUrl.searchParams.get('apiKey') || undefined;

    // Lấy thông tin tài khoản MicroX
    let account = null;
    try {
      account = await getMicroXAccount(apiKey);
    } catch (e: any) {
      console.warn('Lỗi lấy tài khoản MicroX:', e.message);
    }

    // Nếu người dùng tìm kiếm giọng trên MicroX
    let searchResults: any[] = [];
    if (search || category) {
      try {
        const queryParams: any = {
          language: 'vie',
          limit: 20
        };
        if (search) queryParams.query = search;
        if (category) queryParams.category = category;
        const res = await getMicroXVoices(queryParams, apiKey);
        searchResults = res.data || [];
      } catch (e: any) {
        console.warn('Lỗi tìm giọng MicroX:', e.message);
      }
    }

    return NextResponse.json({
      curatedVoices: CURATED_VOICES,
      account,
      searchResults
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
