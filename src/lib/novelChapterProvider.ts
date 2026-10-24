import fs from 'fs';
import path from 'path';
import https from 'https';
import { formatLiteraryParagraphs, normalizeAndPolish, qualityControlCheck } from './novelNormalizer';

const RAW_DIR = path.join(process.cwd(), 'raw_novels/extracted');
const REPO_DIR = path.join(process.cwd(), 'src/data/stories_repo');
const CRAWLED_STORIES_FILE = path.join(process.cwd(), 'src/data/crawled_stories.json');

export const NOVEL_MAPPING: Record<string, { file: string; totalChapters: number; titleVi: string }> = {
  'tro-choi-nay-ky-la-that-toi-da-tro-thanh-mot-vi-than-khai-thac-mo': {
    file: '这个游戏不对劲，我挖矿成神！.txt',
    totalChapters: 975,
    titleVi: 'Trò chơi này kỳ lạ thật, tôi đã trở thành một vị thần khai thác mỏ!'
  },
  'xuyen-tinh-te-mang-di-nang-mat-the-ta-trong-ra-ca-the-gioi-ky-la': {
    file: '穿越后在星际养灵植.txt',
    totalChapters: 590,
    titleVi: 'Xuyên Tinh Tế: Bị Đày Ra Biên Cương Làm Ruộng, Ta Vô Tình Trồng Ra Quái Vật'
  },
  'mat-the-trong-sinh-nu-phu-phan-cong-cuop-sach-co-duyen-nu-chinh-to-niem': {
    file: '末世游戏入侵：女配坏一点怎么了.txt',
    totalChapters: 542,
    titleVi: 'Mạt Thế Trọng Sinh: Nữ Phụ Phản Công, Cướp Sạch Cơ Duyên Nữ Chính - Tô Niệm'
  },
  'tan-the-den-roi-ky-tuc-xa-nu-502-xuat-phat': {
    file: '女寝求生，无限列车躺赢.txt',
    totalChapters: 1074,
    titleVi: 'Tận Thế Đến Rồi! Ký Túc Xá Nữ 502 Xuất Phát!'
  },
  'trong-sinh-mat-the-ta-so-huu-quan-doan-thu-khe-uoc': {
    file: '末日星晶：我有一个契约兽军团.txt',
    totalChapters: 2654,
    titleVi: 'Trọng Sinh Mạt Thế: Ta Sở Hữu Quân Đoàn Thú Khế Ước'
  },
  'xuyen-khong-tinh-te-mot-mieng-thit-chien-lam-ca-lien-bang-phat-cuong-giang-thu-thu': {
    file: '全星际都是我的美食粉丝.txt',
    totalChapters: 1249,
    titleVi: 'Xuyên Không Tinh Tế: Một Miếng Thịt Chiên Làm Cả Liên Bang Phát Cuồng - Giang Thu Thu'
  },
  'phe-tho-xuyen-thanh-me-nuoi-ac-doc-ta-nuoi-bon-nhoc-thanh-dai-lao': {
    file: '废土：恶毒养母带崽吃香喝辣.txt',
    totalChapters: 449,
    titleVi: 'Phế Thổ Xuyên Thành Mẹ Nuôi Ác Độc Ta Nuôi Bốn Nhóc Thành Đại Lão'
  },
  'bac-dau-de-ton': {
    file: '北斗帝尊.txt',
    totalChapters: 1756,
    titleVi: 'Bắc Đẩu Đế Tôn'
  },
  'xuyen-vao-hanh-tinh-rac-thanh-bac-thay-che-tao-co-giap-tu-dong-phe-lieu': {
    file: '金牌制甲师.txt',
    totalChapters: 345,
    titleVi: 'Xuyên Vào Hành Tinh Rác: Thành Bậc Thầy Chế Tạo Cơ Giáp Từ Đống Phế Liệu'
  }
};

// Cache for raw novel bodies
const rawCache = new Map<string, { body: string; matches: RegExpExecArray[] }>();

function getRawBook(slug: string) {
  if (rawCache.has(slug)) return rawCache.get(slug)!;
  const cfg = NOVEL_MAPPING[slug];
  if (!cfg) return null;

  const filePath = path.join(RAW_DIR, cfg.file);
  if (!fs.existsSync(filePath)) return null;

  const buf = fs.readFileSync(filePath);
  const text = new TextDecoder('gb18030').decode(buf);
  const marker = '------章节内容开始-------';
  const markerIdx = text.indexOf(marker);
  const body = markerIdx >= 0 ? text.slice(markerIdx + marker.length) : text;

  const regex = /第\s*([0-9一二三四五六七八九十百千万]+)\s*[章卷]([^\r\n]{0,35})(?:\r?\n|$)/g;
  const matches = [...body.matchAll(regex)];

  const parsed = { body, matches };
  rawCache.set(slug, parsed);
  return parsed;
}

// Google Translate single chunk with retries
function translateChunk(text: string, retries = 3): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const q = encodeURIComponent(text);
    const url = 'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=zh-CN&tl=vi&q=' + q;
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': 'https://translate.google.com/'
      },
      timeout: 15000
    }, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(buf);
          if (Array.isArray(parsed)) {
            resolve(parsed.join(''));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Parse translate error: ${buf.slice(0, 80)}`));
        }
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Translate timeout')); });
    req.on('error', reject);
  }).catch(async (err) => {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1200));
      return translateChunk(text, retries - 1);
    }
    throw err;
  });
}

// Fetch chapter from curated Vietnamese source (tvtruyen) for Bac Dau De Ton
async function fetchCuratedChapter(slug: string, chapterNum: number): Promise<{ title: string; content: string } | null> {
  if (slug === 'bac-dau-de-ton') {
    try {
      const url = `https://www.tvtruyen.space/bac-dau-de-ton/chuong-${chapterNum}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) return null;
      const html = await res.text();

      const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([\s\S]*?)<\/title>/i);
      let title = `Chương ${chapterNum}`;
      if (titleMatch) {
        const rawT = titleMatch[1].replace(/<[^>]+>/g, '').trim();
        const cleanT = rawT.replace(/^.*?\/\s*/, '').replace(/\|\s*TruyenTV.*$/, '').trim();
        if (cleanT) title = cleanT;
      }

      const m = html.match(/<div id="chapter-content">([\s\S]*?)<\/div>/i);
      if (!m) return null;

      let rawContent = m[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();

      const formatted = formatLiteraryParagraphs(rawContent, title, slug);
      if (formatted.length > 500) {
        return {
          title: normalizeAndPolish(title, slug),
          content: formatted
        };
      }
    } catch (e) {
      console.warn(`[Curated Fetch Error] ${slug} ch ${chapterNum}:`, (e as any).message);
    }
  }
  return null;
}

async function translateChapterChinese(chineseText: string, chapterTitleVi: string, slug?: string): Promise<string> {
  const paragraphs = chineseText.split('\n').map(p => p.trim()).filter(Boolean);
  const batches: string[] = [];
  let currentBatch: string[] = [];
  let currentLen = 0;

  for (const p of paragraphs) {
    if (currentLen + p.length > 500) {
      batches.push(currentBatch.join('\n'));
      currentBatch = [p];
      currentLen = p.length;
    } else {
      currentBatch.push(p);
      currentLen += p.length;
    }
  }
  if (currentBatch.length > 0) {
    batches.push(currentBatch.join('\n'));
  }

  const translatedPieces: string[] = [];
  for (let i = 0; i < batches.length; i++) {
    const piece = await translateChunk(batches[i]);
    translatedPieces.push(piece);
    if (i < batches.length - 1) {
      await new Promise(r => setTimeout(r, 120)); // Delay to prevent 429
    }
  }
  const fullVi = translatedPieces.join('\n');

  // Format into paragraphs with strict novel normalization
  return formatLiteraryParagraphs(fullVi, chapterTitleVi, slug);
}

export async function getChapter(slug: string, chapterNum: number) {
  // 1. Check local repo JSON file first (> 300 chars to avoid stubs)
  const repoFile = path.join(REPO_DIR, `${slug}.json`);
  let repoData: any = null;

  if (fs.existsSync(repoFile)) {
    try {
      repoData = JSON.parse(fs.readFileSync(repoFile, 'utf8'));
      const existing = repoData.chapters?.find((c: any) => c.number === chapterNum);
      if (existing && existing.content && existing.content.trim().length > 20) {
        return {
          number: chapterNum,
          title: existing.title || `Chương ${chapterNum}`,
          content: existing.content
        };
      }
    } catch (e) {}
  }

  // 2. Try curated Vietnamese source (e.g. tvtruyen for Bac Dau De Ton)
  const curated = await fetchCuratedChapter(slug, chapterNum);
  if (curated) {
    const chapterObj = {
      id: `chap-${chapterNum}`,
      number: chapterNum,
      title: curated.title,
      content: curated.content
    };
    saveChapterToRepo(slug, repoFile, repoData, chapterObj);
    return chapterObj;
  }

  // 3. Fallback: extract from raw Chinese novel file & translate with context glossaries
  const book = getRawBook(slug);
  if (!book) return null;

  if (chapterNum < 1 || chapterNum > book.matches.length) return null;

  let matchIdx = chapterNum - 1;
  let currentM = book.matches[matchIdx];
  let nextM = book.matches[matchIdx + 1];

  // Nếu độ dài giữa 2 tiêu đề < 50 ký tự, đó là tiêu đề bị gõ lặp trong file raw -> bỏ qua tiêu đề rỗng
  if (nextM && (nextM.index - currentM.index < 50) && (matchIdx + 1 < book.matches.length)) {
    matchIdx++;
    currentM = book.matches[matchIdx];
    nextM = book.matches[matchIdx + 1];
  }

  const titleZh = currentM[2] ? currentM[2].trim() : '';
  const start = currentM.index + currentM[0].length;
  const end = nextM ? nextM.index : book.body.length;
  const contentZh = book.body.slice(start, end).trim();

  // Translate title
  let viTitle = `Chương ${chapterNum}`;
  if (titleZh && titleZh.length > 0) {
    try {
      const cleanZh = titleZh.replace(/^[0-9\.\s]+/, '').trim();
      if (cleanZh) {
        const transTitle = await translateChunk(cleanZh);
        viTitle = `Chương ${chapterNum}: ${normalizeAndPolish(transTitle, slug)}`;
      }
    } catch (e) {
      viTitle = `Chương ${chapterNum}`;
    }
  }

  // Translate content
  let formattedContent = await translateChapterChinese(contentZh, viTitle, slug);

  // Quality Control Gate Check
  const qc = qualityControlCheck(formattedContent, viTitle, slug);
  if (!qc.passed) {
    console.warn(`[QC Alert] Chapter ${chapterNum} of ${slug} flagged:`, qc.reasons);
    // Auto-remediate: re-apply polish and sanitize
    formattedContent = normalizeAndPolish(formattedContent, slug);
    viTitle = normalizeAndPolish(viTitle, slug);
  }

  const chapterObj = {
    id: `chap-${chapterNum}`,
    number: chapterNum,
    title: viTitle,
    content: formattedContent
  };

  // 4. Cache into repo file
  saveChapterToRepo(slug, repoFile, repoData, chapterObj);

  return chapterObj;
}

function saveChapterToRepo(slug: string, repoFile: string, repoData: any, chapterObj: any) {
  try {
    if (!repoData) {
      repoData = {
        id: slug,
        slug,
        title: NOVEL_MAPPING[slug]?.titleVi || slug,
        chapters: []
      };
    }
    if (!repoData.chapters) repoData.chapters = [];
    const idx = repoData.chapters.findIndex((c: any) => c.number === chapterObj.number);
    if (idx >= 0) {
      repoData.chapters[idx] = chapterObj;
    } else {
      repoData.chapters.push(chapterObj);
      repoData.chapters.sort((a: any, b: any) => a.number - b.number);
    }
    fs.writeFileSync(repoFile, JSON.stringify(repoData, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving to repo file:', err);
  }
}
