import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import fs from 'fs';
import path from 'path';

const DEFAULT_API_KEY =
  process.env.MICROX_API_KEY ||
  'mx_live_eyJjbGllbnRJZCI6IjQ1OTg5MzNiLTgwMDAtNDQyNy1iNjNlLWI2MWUwZDU4MGU3YyIsImV4cGlyZXNBdCI6MTgxNzM2OTk3MTI1OSwibmFtZSI6IkRvYW4gQmFjaCIsInVzZXJJZCI6ImNiMmE2MGFkLTFmMDgtNDIzYy04YmQxLTdlNjAxNGIzZTE5MyIsInZlcnNpb24iOjF9.mUnOV4jScEwQ8fXmAHL51ONCEw2eay6VIxPebddHS_Y';

const CACHE_DIR = path.join(process.cwd(), '.cache', 'tts_previews');
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (e) {}

export async function GET(req: NextRequest) {
  try {
    const voiceId = req.nextUrl.searchParams.get('voiceId');
    const apiKey = req.nextUrl.searchParams.get('apiKey') || DEFAULT_API_KEY;

    if (!voiceId) {
      return new NextResponse('Thiếu voiceId', { status: 400 });
    }

    const cacheFile = path.join(CACHE_DIR, `${voiceId}.mp3`);
    if (fs.existsSync(cacheFile)) {
      const cached = fs.readFileSync(cacheFile);
      if (cached && cached.length > 0) {
        return new NextResponse(new Uint8Array(cached), {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=604800, immutable',
          },
        });
      }
    }

    const audioBuffer = await new Promise<Buffer>((resolve, reject) => {
      https
        .get(
          `https://www.microx.app/api/v1/voices/${voiceId}/preview`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            timeout: 10000,
          },
          (res) => {
            if (res.statusCode !== 200) {
              return reject(new Error(`MicroX preview HTTP ${res.statusCode}`));
            }
            const chunks: Buffer[] = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
          }
        )
        .on('error', reject);
    });

    try {
      fs.writeFileSync(cacheFile, audioBuffer);
    } catch (e) {}

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message || 'Lỗi tải preview', { status: 500 });
  }
}
