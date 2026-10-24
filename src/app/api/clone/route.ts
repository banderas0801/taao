import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { REF_ID_REGEX } from '@/lib/ttsVoiceRouter';

function getClonedVoicesDir(): string {
  const dir = path.join(process.cwd(), '.cache', 'cloned_voices');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, audioBase64, gender, region, style } = body;

    if (!audioBase64) {
      return NextResponse.json({ success: false, error: 'Thiếu dữ liệu âm thanh audioBase64' }, { status: 400 });
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
    const audioBuffer = Buffer.from(cleanBase64, 'base64');

    if (audioBuffer.length < 1000) {
      return NextResponse.json({ success: false, error: 'Dữ liệu âm thanh quá ngắn hoặc không hợp lệ' }, { status: 400 });
    }

    // Chặn ngay tại tầng Route: Không chấp nhận file vượt quá 2MB để bảo vệ RAM
    const MAX_AUDIO_BYTES = 2 * 1024 * 1024;
    if (audioBuffer.length > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { success: false, error: `Dữ liệu âm thanh quá lớn (tối đa ${MAX_AUDIO_BYTES / 1024 / 1024}MB)` },
        { status: 413 }
      );
    }

    // 1. Server TỰ SINH refId chuẩn bảo mật: regex ^[a-z0-9_-]{8,40}$
    // Định dạng: c_<random8hex>_<timestampBase36> (khoảng 22 ký tự, toàn chữ thường, số, _)
    const randPart = crypto.randomBytes(4).toString('hex');
    const timePart = Date.now().toString(36).toLowerCase();
    const serverGeneratedRefId = `c_${randPart}_${timePart}`;

    if (!REF_ID_REGEX.test(serverGeneratedRefId)) {
      return NextResponse.json({ success: false, error: 'Lỗi sinh mã refId trên máy chủ' }, { status: 500 });
    }

    const dir = getClonedVoicesDir();
    const jsonPath = path.join(dir, `${serverGeneratedRefId}.json`);

    // 2. Gửi sang dịch vụ Python VieNeu v3 Nano nội bộ (Port 8005)
    let pythonProfile: any = null;
    let pyErrorDetail: string | null = null;
    let pyStatusCode = 503;
    try {
      const controller = new AbortController();
      // Nâng thời gian chờ lên 90s để hỗ trợ tải mô hình clone lần đầu trên VPS 1 vCPU
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const vieneuBase = process.env.VIENEU_SERVICE_URL || 'http://127.0.0.1:8005';
      const pyRes = await fetch(`${vieneuBase}/extract_embedding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ref_id: serverGeneratedRefId,
          audio_base64: cleanBase64,
          gender_hint: gender || 'male',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (pyRes.ok) {
        pythonProfile = await pyRes.json();
      } else {
        pyStatusCode = pyRes.status;
        const errJson = await pyRes.json().catch(() => null);
        pyErrorDetail = errJson?.detail || (await pyRes.text().catch(() => `HTTP ${pyRes.status}`));
      }
    } catch (e: any) {
      pyErrorDetail = e.name === 'AbortError' ? 'Quá thời gian chờ (90s) từ dịch vụ VieNeu' : e.message;
      pyStatusCode = 504;
      console.warn('Lỗi gọi Python extract_embedding:', pyErrorDetail);
    }

    // NẾU PYTHON CHƯA CHẠY HOẶC MẪU KHÔNG ĐẠT: Báo lỗi rõ ràng, giữ nguyên mã HTTP gốc của Python (400/409/413/500/504)
    if (!pythonProfile || pythonProfile.success === false) {
      return NextResponse.json({
        success: false,
        error: pyErrorDetail || 'Dịch vụ nhân bản giọng VieNeu v3 Nano chưa sẵn sàng hoặc mẫu âm thanh không đạt chuẩn.',
        details: pyErrorDetail,
      }, { status: pyStatusCode });
    }

    const isMale = pythonProfile?.is_male ?? (gender === 'male');
    const voiceProfile = {
      voice_id: serverGeneratedRefId,
      id: serverGeneratedRefId,
      name: name || 'Giọng nhân bản',
      gender: isMale ? 'male' : 'female',
      region: region || 'Bắc',
      style: style || 'Tự nhiên',
      model: 'vieneu-v3-nano',
      ref_id: serverGeneratedRefId,
      refId: serverGeneratedRefId,
      total_duration: pythonProfile.total_duration,
      speech_duration: pythonProfile.speech_duration,
      created_at: Date.now(),
    };

    fs.writeFileSync(jsonPath, JSON.stringify(voiceProfile, null, 2));

    return NextResponse.json({
      success: true,
      profile: voiceProfile,
      refId: serverGeneratedRefId,
      message: `Đã nhân bản đặc trưng giọng "${name}" (${isMale ? 'Nam' : 'Nữ'}) bằng VieNeu v3 Nano thành công!`,
    });
  } catch (error: any) {
    console.error('Lỗi API /api/clone:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi server' }, { status: 500 });
  }
}
