import https from 'https';
import http from 'http';
import crypto from 'crypto';
import { polishVietnameseText } from './vietnamesePolisher';

const DEFAULT_API_KEY =
  process.env.MICROX_API_KEY ||
  'mx_live_eyJjbGllbnRJZCI6IjQ1OTg5MzNiLTgwMDAtNDQyNy1iNjNlLWI2MWUwZDU4MGU3YyIsImV4cGlyZXNBdCI6MTgxNzM2OTk3MTI1OSwibmFtZSI6IkRvYW4gQmFjaCIsInVzZXJJZCI6ImNiMmE2MGFkLTFmMDgtNDIzYy04YmQxLTdlNjAxNGIzZTE5MyIsInZlcnNpb24iOjF9.mUnOV4jScEwQ8fXmAHL51ONCEw2eay6VIxPebddHS_Y';

const BASE_URL = process.env.MICROX_BASE_URL || 'https://www.microx.app/api/v1';

export const MICROX_VOICE_MAP: Record<string, string> = {
  'ngocngan': 'voice_717f9e7c4a371d668b7dd242',
  'voice_ngocngan': 'voice_717f9e7c4a371d668b7dd242',
  'hagiang': 'voice_e347bfc946cc9232466347ca',
  'voice_hagiang': 'voice_e347bfc946cc9232466347ca',
  'vincente': 'voice_bc521fe706b858344a590567',
  'voice_vincente': 'voice_bc521fe706b858344a590567',
  'thuytien': 'voice_42a7dc8e1d41998bf7aa5d7e',
  'voice_thuytien': 'voice_42a7dc8e1d41998bf7aa5d7e',
  'quangtoan': 'voice_58c3f1cae6744f008a5048fd',
  'voice_quangtoan': 'voice_58c3f1cae6744f008a5048fd',
  'nhatnam': 'voice_4a3e1a0409e4c2bb591bf6f9',
  'voice_nhatnam': 'voice_4a3e1a0409e4c2bb591bf6f9',
};

// ==========================================
// BỘ ĐIỀU PHỐI CONCURRENCY CHỐNG LỖI 429
// MicroX chỉ cho phép tối đa 3 tác vụ đồng thời / API key.
// Ta giới hạn nghiêm ngặt 2 tác vụ song song trên toàn server.
// ==========================================
let activeMicroXJobs = 0;
const microXQueue: (() => void)[] = [];

function acquireMicroXSlot(): Promise<void> {
  return new Promise((resolve) => {
    if (activeMicroXJobs < 2) {
      activeMicroXJobs++;
      resolve();
    } else {
      microXQueue.push(resolve);
    }
  });
}

function releaseMicroXSlot() {
  activeMicroXJobs--;
  if (microXQueue.length > 0) {
    activeMicroXJobs++;
    const next = microXQueue.shift();
    if (next) next();
  }
}

function makeRequest(
  urlStr: string,
  options: https.RequestOptions,
  bodyData?: any
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === 'http:' ? http : https;

    const req = client.request(url, options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        try {
          resolve({ status: res.statusCode || 500, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode || 500, data: raw });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('MicroX request timeout'));
    });

    if (bodyData) {
      const str = typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData);
      req.write(str);
    }
    req.end();
  });
}

function downloadBinary(urlStr: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = urlStr.startsWith('http:') ? http : https;

    client
      .get(urlStr, { timeout: 30000 }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadBinary(res.headers.location).then(resolve).catch(reject);
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`Tải audio thất bại, mã HTTP: ${res.statusCode}`));
        }

        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

export interface MicroXOptions {
  speed?: number;
  creativity?: number;
  apiKey?: string;
}

export async function synthesizeMicroX(
  rawText: string,
  voiceId: string,
  options?: MicroXOptions
): Promise<Buffer> {
  const apiKey = options?.apiKey || DEFAULT_API_KEY;
  if (!apiKey) {
    throw new Error('Chưa cấu hình MicroX API Key');
  }

  const cleanText = polishVietnameseText(
    rawText
      .replace(/[*#_~`]/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim()
  );

  if (!cleanText) {
    throw new Error('Nội dung văn bản trống');
  }

  // Chuẩn hóa voiceId (hỗ trợ cả alias và id gốc)
  const normalizedId = voiceId.toLowerCase().trim();
  const realVoiceId = MICROX_VOICE_MAP[normalizedId] || voiceId;

  // Lấy slot concurrency để tránh chạm trần 3 jobs
  await acquireMicroXSlot();

  try {
    const textHash = crypto
      .createHash('md5')
      .update(`${realVoiceId}:${cleanText}:${options?.speed || 1.0}:${options?.creativity || 0.5}`)
      .digest('hex');

    // Thử tối đa 3 lượt khởi tạo Job (phòng trường hợp MicroX báo processing_failed do quá tải)
    for (let jobAttempt = 0; jobAttempt < 3; jobAttempt++) {
      // DÙNG IDEMPOTENCY KEY ĐỘNG CÓ SALT để MicroX KHÔNG lưu kết quả lỗi của lần thử trước
      const idempotencyKey = `tts-${textHash}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

      let createRes: { status: number; data: any } | null = null;

      // Vòng lặp chống 429 khi MicroX báo concurrency limit: Chờ 1.5s rồi thử lại
      for (let attempt = 0; attempt < 5; attempt++) {
        createRes = await makeRequest(
          `${BASE_URL}/text-to-speech`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json; charset=utf-8',
              'Idempotency-Key': idempotencyKey,
            },
            timeout: 20000,
          },
          {
            voice_id: realVoiceId,
            text: cleanText,
            speed: options?.speed ?? 1.0,
            creativity: options?.creativity ?? 0.5,
          }
        );

        if (createRes.status === 429) {
          console.warn(`[MicroX] Đạt giới hạn Concurrency (429), chờ 1.5s trước lần thử ${attempt + 1}...`);
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        break;
      }

      if (!createRes || (createRes.status !== 200 && createRes.status !== 201 && createRes.status !== 202)) {
        const errMsg = typeof createRes?.data === 'object' ? JSON.stringify(createRes.data) : createRes?.data;
        if (jobAttempt < 2) {
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }
        throw new Error(`MicroX TTS Error (${createRes?.status || 500}): ${errMsg}`);
      }

      const job = createRes.data;
      if (job.status === 'completed' && job.result?.audio_url) {
        return await downloadBinary(job.result.audio_url);
      }

      const jobId = job.id || job.job_id;
      if (!jobId) {
        throw new Error('Không nhận được Job ID từ MicroX');
      }

      // 2. Poll trạng thái job (Tối đa 35 lần x 1.2s ~ 42 giây)
      let failedError: string | null = null;
      let downloadedAudio: Buffer | null = null;

      for (let attempt = 1; attempt <= 35; attempt++) {
        await new Promise((r) => setTimeout(r, 1200));

        let pollRes: { status: number; data: any } | null = null;
        try {
          pollRes = await makeRequest(`${BASE_URL}/jobs/${jobId}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            timeout: 10000,
          });
        } catch (_) {
          continue;
        }

        if (pollRes && pollRes.status === 200) {
          const pollData = pollRes.data;
          if (pollData.status === 'completed' && pollData.result?.audio_url) {
            downloadedAudio = await downloadBinary(pollData.result.audio_url);
            break;
          }

          if (pollData.status === 'failed') {
            failedError = pollData.error?.message || JSON.stringify(pollData.error || pollData);
            console.warn(`[MicroX] Job ${jobId} failed: ${failedError}`);
            break;
          }
        }
      }

      if (downloadedAudio && downloadedAudio.length > 0) {
        return downloadedAudio;
      }

      if (jobAttempt < 2) {
        console.warn(`[MicroX] Job ${jobId} chưa xong (${failedError || 'Timeout'}), khởi tạo lại job mới...`);
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }

      throw new Error(`MicroX TTS thất bại sau 3 lần thử: ${failedError || 'Timeout sau 42s'}`);
    }

    throw new Error('MicroX TTS không thể hoàn thành tổng hợp âm thanh');
  } finally {
    releaseMicroXSlot();
  }
}

export async function getMicroXAccount(apiKeyOverride?: string) {
  const apiKey = apiKeyOverride || DEFAULT_API_KEY;
  const res = await makeRequest(`${BASE_URL}/account`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: 10000,
  });
  return res.data;
}

export async function getMicroXVoices(params: Record<string, string | number> = {}, apiKeyOverride?: string) {
  const apiKey = apiKeyOverride || DEFAULT_API_KEY;
  const qs = new URLSearchParams(params as any).toString();
  const url = `${BASE_URL}/voices?${qs}`;
  const res = await makeRequest(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: 10000,
  });
  return res.data;
}
