import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { polishVietnameseText } from '@/lib/vietnamesePolisher';
import { synthesizeMicroX } from '@/lib/microxTts';
import { getVoiceById } from '@/data/voices';
import { resolveVoice } from '@/lib/ttsVoiceRouter';

// Khởi tạo bộ bảo vệ tiến trình chống crash do ngắt kết nối WebSocket bất ngờ
if (!(globalThis as any).__tts_safety_guards) {
  (globalThis as any).__tts_safety_guards = true;
  process.on('unhandledRejection', (reason) => {
    console.warn('[TTS Safety] Caught unhandledRejection (process protected):', (reason as any)?.message || reason);
  });
  process.on('uncaughtException', (err) => {
    console.warn('[TTS Safety] Caught uncaughtException (process protected):', err.message);
  });
}

// Helper lấy đường dẫn file cache an toàn trong runtime, tránh Turbopack static tracing cảnh báo
function getTtsCacheFilePath(cacheKey: string): string {
  const dir = path.join(process.cwd(), '.cache', 'tts');
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (_) {}
  return path.join(dir, `${cacheKey}.mp3`);
}

// Helper tải một đoạn âm thanh ngắn từ Google Translate TTS (Fail-safe backup)
function fetchGoogleTTSChunk(text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const url =
      'https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=' +
      encodeURIComponent(text.trim());

    https
      .get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            Referer: 'https://translate.google.com/',
          },
          timeout: 8000,
        },
        (res) => {
          if (res.statusCode !== 200) {
            return reject(new Error(`Google TTS status: ${res.statusCode}`));
          }
          const chunks: Buffer[] = [];
          res.on('data', (c: Buffer) => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks)));
        }
      )
      .on('error', reject);
  });
}

// Cắt đoạn văn bản dài thành các câu nhỏ dưới 170 ký tự cho Google TTS
function splitTextIntoChunks(text: string, maxLen = 170): string[] {
  const clean = text
    .replace(/[*#_~`]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();

  if (clean.length <= maxLen) return [clean];

  const chunks: string[] = [];
  const sentences = clean.split(/(?<=[.?!;,\n])\s+/);

  let current = '';
  for (const s of sentences) {
    if (!s) continue;
    if ((current + ' ' + s).trim().length <= maxLen) {
      current = (current + ' ' + s).trim();
    } else {
      if (current) chunks.push(current);
      if (s.length > maxLen) {
        const words = s.split(/\s+/);
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).trim().length <= maxLen) {
            sub = (sub + ' ' + w).trim();
          } else {
            if (sub) chunks.push(sub);
            sub = w;
          }
        }
        if (sub) current = sub;
        else current = '';
      } else {
        current = s;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.filter((c) => c.trim().length > 0);
}

// Tổng hợp âm thanh bằng Google Translate TTS
async function synthesizeGoogle(text: string): Promise<Buffer> {
  const chunks = splitTextIntoChunks(polishVietnameseText(text));
  const audioBuffers: Buffer[] = [];
  for (const chunk of chunks) {
    try {
      const buf = await fetchGoogleTTSChunk(chunk);
      if (buf && buf.length > 0) audioBuffers.push(buf);
    } catch (err: any) {
      console.warn('Lỗi tải Google TTS chunk:', err.message);
    }
  }
  if (audioBuffers.length === 0) {
    throw new Error('Không thể tổng hợp âm thanh từ Google TTS');
  }
  return Buffer.concat(audioBuffers);
}

// Escape và chuẩn hóa ký tự cho SSML để Microsoft Bing Edge TTS không bao giờ ngắt kết nối
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/["“”«»'']/g, ' ') // Loại bỏ ngoặc kép tránh lỗi cú pháp Bing
    .replace(/([.?!])\s*[—–―−]/g, '$1 ')
    .replace(/[—–―−]\s*([.?!])/g, '$1')
    .replace(/[—–―−]/g, ', ') // Thay thế gạch ngang dài còn lại bằng dấu phẩy
    .replace(/\.{2,}/g, '.') // Thay thế dấu chấm lửng liên tiếp bằng 1 dấu chấm
    .replace(/…/g, '.')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

// Cắt câu an toàn dưới maxLen ký tự cho Edge TTS nếu đoạn quá dài
function splitEdgeChunks(text: string, maxLen = 600): string[] {
  if (text.length <= maxLen) return [text];
  const sentences = text.split(/(?<=[.?!;:\n])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const s of sentences) {
    if (!s) continue;
    if ((current + ' ' + s).trim().length <= maxLen) {
      current = (current + ' ' + s).trim();
    } else {
      if (current) chunks.push(current);
      if (s.length > maxLen) {
        const parts = s.split(/(?<=[,])\s+/);
        for (const p of parts) {
          if ((current + ' ' + p).trim().length <= maxLen) {
            current = (current + ' ' + p).trim();
          } else {
            if (current) chunks.push(current);
            current = p;
          }
        }
      } else {
        current = s;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.filter((c) => c.trim().length > 0);
}

// Tổng hợp âm thanh 1 cụm bằng Edge TTS với hỗ trợ cao độ pitch & tốc độ rate SSML (In-Memory Stream)
async function synthesizeEdgeSingleChunk(
  chunk: string,
  edgeVoice: string,
  pitch = '+0%',
  rate = '+0%'
): Promise<Buffer> {
  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const tts = new MsEdgeTTS();

    try {
      await tts.setMetadata(edgeVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const escaped = escapeXml(chunk);
      // Nếu lần thử 1 bị lỗi, lần 2 thử pitch mặc định an toàn +0%
      const effectivePitch = attempt === 1 ? pitch : '+0%';
      const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="vi-VN"><voice name="${edgeVoice}"><prosody pitch="${effectivePitch}" rate="${rate}">${escaped}</prosody></voice></speak>`;

      const { audioStream } = tts.rawToStream(ssml);
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        audioStream.on('data', (d: Buffer) => chunks.push(d));
        audioStream.on('end', () => resolve());
        audioStream.on('error', (err: any) => reject(err));
      });

      const buffer = Buffer.concat(chunks);
      if (buffer && buffer.length > 0) {
        return buffer;
      }
    } catch (err: any) {
      lastError = err;
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 200 * attempt));
      }
    } finally {
      try {
        tts.close();
      } catch (e) {}
    }
  }
  throw lastError || new Error(`Edge TTS chunk thất bại sau 3 lần thử`);
}

// Tổng hợp âm thanh bằng Microsoft Edge TTS với khả năng biến điệu giọng (Nam Trầm Kể Chuyện, Nữ Dịu Mắt...)
async function synthesizeEdge(
  text: string,
  edgeVoice: string,
  pitch = '+0%',
  rate = '+0%'
): Promise<Buffer> {
  const cleanText = polishVietnameseText(
    text
      .replace(/[*#_~`]/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim()
  );

  const chunks = splitEdgeChunks(cleanText, 700);
  if (chunks.length === 1) {
    return await synthesizeEdgeSingleChunk(chunks[0], edgeVoice, pitch, rate);
  }

  // Tổng hợp song song các cụm bằng Promise.all để tăng tốc gấp đôi
  const audioBuffers = await Promise.all(
    chunks.map((chunk) => synthesizeEdgeSingleChunk(chunk, edgeVoice, pitch, rate))
  );
  return Buffer.concat(audioBuffers);
}

// Helper gọi dịch vụ Python TTS nội bộ trên VPS (Port 8005) - Chỉ gửi ref_id, KHÔNG gửi path
async function fetchPythonTts(payload: { text: string; ref_id: string }): Promise<Buffer | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    const vieneuBase = process.env.VIENEU_SERVICE_URL || 'http://127.0.0.1:8005';
    const res = await fetch(`${vieneuBase}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok && res.status === 200) {
      const ab = await res.arrayBuffer();
      if (ab.byteLength > 200) {
        return Buffer.from(ab);
      }
    }
  } catch (_) {}
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const text = req.nextUrl.searchParams.get('text');
    const rawVoice = req.nextUrl.searchParams.get('voice') || 'namminh';
    const speed = parseFloat(req.nextUrl.searchParams.get('speed') || '1.0');
    const creativity = parseFloat(req.nextUrl.searchParams.get('creativity') || '0.5');
    const apiKey = req.nextUrl.searchParams.get('apiKey') || undefined;
    const customPitchParam = req.nextUrl.searchParams.get('pitch') || undefined;
    const customRateParam = req.nextUrl.searchParams.get('rate') || undefined;

    if (!text || text.trim().length === 0) {
      return new NextResponse('Thiếu tham số text', { status: 400 });
    }

    // 1. Phân loại giọng đọc nghiêm ngặt bằng Discriminated Union (Kind: edge | clone | microx)
    const voiceConfig = resolveVoice(rawVoice, {
      customPitch: customPitchParam,
      customRate: customRateParam,
    });

    // 2. Cache Key riêng biệt theo từng Kind, ngăn chặn 100% lẫn lộn giữa các giọng
    let cacheKeyPart = '';
    switch (voiceConfig.kind) {
      case 'edge':
        cacheKeyPart = `edge:${voiceConfig.edgeVoice}:${voiceConfig.pitch || '+0%'}:${voiceConfig.rate || '+0%'}`;
        break;
      case 'clone':
        cacheKeyPart = `clone:${voiceConfig.refId}`;
        break;
      case 'microx':
        cacheKeyPart = `microx:${voiceConfig.voiceId}:${creativity}`;
        break;
    }
    const cacheKey = crypto
      .createHash('md5')
      .update(`v13:${cacheKeyPart}:${speed}:${text.trim()}`)
      .digest('hex');
    const cacheFile = getTtsCacheFilePath(cacheKey);

    if (fs.existsSync(cacheFile)) {
      try {
        const cachedData = fs.readFileSync(cacheFile);
        if (cachedData && cachedData.length > 0) {
          return new NextResponse(new Uint8Array(cachedData), {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': cachedData.length.toString(),
              'Cache-Control': 'public, max-age=86400, immutable',
              'X-TTS-Source': 'cache',
              'X-TTS-Voice': rawVoice,
            },
          });
        }
      } catch (e) {
        console.warn('Lỗi đọc file cache TTS:', e);
      }
    }

    // 3. Định tuyến tổng hợp âm thanh chính xác theo kind:
    let audioBuffer: Buffer | null = null;
    let actualSource = rawVoice;

    switch (voiceConfig.kind) {
      case 'microx': {
        try {
          audioBuffer = await synthesizeMicroX(text, voiceConfig.voiceId, {
            speed,
            creativity,
            apiKey,
          });
          actualSource = `microx-${voiceConfig.voiceId}`;
        } catch (err: any) {
          console.warn(`[TTS] MicroX failed (${err.message})`);
          return new NextResponse(
            JSON.stringify({ error: `MicroX error: ${err.message}`, code: 'MICROX_ERROR' }),
            { status: 502, headers: { 'Content-Type': 'application/json' } }
          );
        }
        break;
      }

      case 'clone': {
        // Chỉ gửi sang Python service với ref_id, không bao giờ gửi sang Edge-TTS hay Nam Minh!
        audioBuffer = await fetchPythonTts({ text, ref_id: voiceConfig.refId });
        if (!audioBuffer) {
          return new NextResponse(
            JSON.stringify({
              error: 'Dịch vụ nhân bản giọng VieNeu v3 Nano (cổng 8005) đang bận hoặc chưa tải xong model.',
              code: 'VIENEU_NOT_READY',
              refId: voiceConfig.refId,
            }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        }
        actualSource = `vieneu-clone-${voiceConfig.refId}`;
        break;
      }

      case 'edge': {
        // Tuyệt đối không gửi sang Python VieNeu!
        const baseSpeed = Math.max(0.5, Math.min(2.0, speed));
        let ratePct = Math.round((baseSpeed - 1.0) * 100);
        if (voiceConfig.rate) {
          const parsed = parseInt(voiceConfig.rate.replace('%', ''), 10) || 0;
          ratePct += parsed;
        }
        const effectiveRate = `${ratePct >= 0 ? '+' : ''}${ratePct}%`;

        try {
          audioBuffer = await synthesizeEdge(
            text,
            voiceConfig.edgeVoice,
            voiceConfig.pitch || '+0%',
            effectiveRate
          );
          actualSource = `edge-${voiceConfig.edgeVoice}`;
        } catch (err: any) {
          console.warn(`[TTS] Edge-TTS error: ${err.message}`);
          return new NextResponse(
            JSON.stringify({ error: `Edge TTS error: ${err.message}`, code: 'EDGE_ERROR' }),
            { status: 502, headers: { 'Content-Type': 'application/json' } }
          );
        }
        break;
      }
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return new NextResponse('Không thể tổng hợp âm thanh', { status: 500 });
    }

    // Ghi cache nếu thành công
    try {
      fs.writeFileSync(cacheFile, audioBuffer);
    } catch (e) {
      console.warn('Không thể lưu file cache TTS:', e);
    }

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, immutable',
        'Accept-Ranges': 'bytes',
        'X-TTS-Source': actualSource,
        'X-TTS-Voice': rawVoice,
        'X-TTS-Kind': voiceConfig.kind,
      },
    });
  } catch (error: any) {
    if (error?.name === 'InvalidVoiceError') {
      return new NextResponse(
        JSON.stringify({ error: error.message, code: 'INVALID_VOICE' }),
        { status: error.statusCode || 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.error('Lỗi TTS API:', error);
    return new NextResponse(error.message || 'Lỗi xử lý âm thanh', { status: 500 });
  }
}
