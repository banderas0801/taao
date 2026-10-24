import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function getTtsCacheFilePath(cacheKey: string): string {
  const dir = path.join(process.cwd(), '.cache', 'tts');
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (_) {}
  return path.join(dir, `${cacheKey}.mp3`);
}

// API kiểm tra và kích hoạt tạo sẵn (Pre-generate) Audio cả chương trên máy chủ VPS
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sentences = [], voice = 'anh-khoi', speed = 1.0, creativity = 0.5 } = body;

    if (!Array.isArray(sentences) || sentences.length === 0) {
      return NextResponse.json({ success: false, error: 'Danh sách câu trống' }, { status: 400 });
    }

    const isMicroX = voice.startsWith('voice_') || voice.startsWith('mx_') || voice.startsWith('clone_');
    const checkedList = sentences.map((item: any, index: number) => {
      const text = (typeof item === 'string' ? item : item?.text || '').trim();
      if (!text) return { index, text: '', exists: false, cacheKey: '' };

      const cacheKey = crypto
        .createHash('md5')
        .update(`v8:${voice}:${speed}:${isMicroX ? creativity : ''}:${text}`)
        .digest('hex');
      const cacheFile = getTtsCacheFilePath(cacheKey);
      const exists = fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 100;

      return {
        index,
        text,
        exists,
        cacheKey,
      };
    });

    const existingCount = checkedList.filter((c) => c.exists).length;
    const missingSentences = checkedList.filter((c) => !c.exists && c.text.length > 0);

    return NextResponse.json({
      success: true,
      total: sentences.length,
      cachedCount: existingCount,
      missingCount: missingSentences.length,
      isFullyCached: missingSentences.length === 0,
      details: {
        voice,
        speed,
        missingIndices: missingSentences.map((m) => m.index),
      },
    });
  } catch (err: any) {
    console.error('[TTS Pre-generate API Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
