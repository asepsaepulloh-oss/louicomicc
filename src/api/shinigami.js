const SHINIGAMI_BASE = 'https://apis.louiv.me/api';

/**
 * Clean Shinigami slug/id from raw string
 */
function cleanId(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/?manga\/chapter\//, '')
    .replace(/^\/?manga\//, '')
    .replace(/^\//, '')
    .replace(/\/$/, '');
}

/**
 * Minimal fetch wrapper that unwraps Shinigami's { success, data } envelope.
 */
async function shig(path, params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  const url = `${SHINIGAMI_BASE}${path}${qs ? `?${qs}` : ''}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Shinigami API error (${res.status})`);
    const json = await res.json();
    if (json && json.success === false) throw new Error(json.message || 'Shinigami API error');
    return json.data !== undefined ? json.data : json;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('Waktu permintaan Shinigami habis (timeout). Silakan coba lagi.');
    throw err;
  }
}

/** Normalize one raw manga item into a common shape. */
function shigItem(raw, extra = {}) {
  const status = (raw.status || '').toLowerCase();
  const id = cleanId(raw.url || raw.id || raw.slug || raw.title);
  
  // Extract latest chapter number if available
  let latestChapter = extra.latestChapter ?? null;
  if (!latestChapter && (raw.latestChapter || raw.chapter)) {
    const chStr = raw.latestChapter || raw.chapter;
    const match = String(chStr).match(/(\d+(?:\.\d+)?)/);
    latestChapter = {
      title: chStr,
      num: match ? parseFloat(match[1]) : null
    };
  }

  // Genre normalizing
  let genre = [];
  if (Array.isArray(raw.genre)) {
    genre = raw.genre;
  } else if (raw.genre) {
    genre = String(raw.genre).split(',').map((g) => g.trim()).filter(Boolean);
  }

  // Type normalizing
  let type = extra.type || raw.type;
  if (!type) {
    if (genre.some(g => /manhwa/i.test(g))) type = 'Manhwa';
    else if (genre.some(g => /manhua/i.test(g))) type = 'Manhua';
    else type = 'Manga';
  }

  return {
    source: 'shinigami',
    id,
    title: raw.title || 'Tanpa Judul',
    thumbnail: raw.thumbnail || '',
    type,
    genre,
    status: raw.status || (status === 'ongoing' ? 'Ongoing' : status === 'completed' ? 'Completed' : 'Ongoing'),
    latestChapter,
  };
}

export const shinigami = {
  key: 'shinigami',
  name: 'Shinigami',

  /** Popular / latest manga list (paginated). */
  async list({ kind = 'popular', page = 1, q, type } = {}) {
    let data;
    if (kind === 'latest') {
      data = await shig('/manga/latest', { page });
    } else if (q) {
      data = await shig('/manga/search', { q, page });
    } else {
      data = await shig('/manga/popular', { page });
    }

    const rawList = data?.mangas || data?.items || (Array.isArray(data) ? data : []);
    let items = rawList.map((m) => shigItem(m, { type }));
    
    if (type && type !== 'Semua') {
      items = items.filter((m) => m.type.toLowerCase() === type.toLowerCase());
    }

    return { 
      items, 
      page: Number(page), 
      hasMore: Boolean(data?.hasNextPage || (rawList.length >= 10)) 
    };
  },

  async detail(id) {
    const rawId = cleanId(id);
    const d = await shig(`/manga/${rawId}`);
    
    let genre = [];
    if (Array.isArray(d.genre)) {
      genre = d.genre;
    } else if (d.genre) {
      genre = String(d.genre).split(',').map((g) => g.trim()).filter(Boolean);
    }

    let type = d.type;
    if (!type) {
      if (genre.some(g => /manhwa/i.test(g))) type = 'Manhwa';
      else if (genre.some(g => /manhua/i.test(g))) type = 'Manhua';
      else type = 'Manga';
    }

    return {
      source: 'shinigami',
      id: rawId,
      title: d.title || 'Tanpa Judul',
      altTitle: d.alternativeTitle || d.altTitle || '',
      thumbnail: d.thumbnail || '',
      author: d.author || 'Tidak diketahui',
      artist: d.artist || '',
      status: d.status || 'Ongoing',
      genre,
      type,
      description: d.description || d.synopsis || 'Belum ada sinopsis untuk komik ini.',
    };
  },

  async chapters(id) {
    const rawId = cleanId(id);
    const raw = await shig(`/manga/${rawId}/chapters`);
    const list = Array.isArray(raw) ? raw : (raw?.chapters || []);
    
    const parsed = list.map((c) => {
      const chName = c.name || c.title || `Chapter ${c.number || ''}`;
      const match = String(chName).match(/(\d+(?:\.\d+)?)/);
      const num = match ? parseFloat(match[1]) : (c.number !== undefined ? parseFloat(c.number) : null);
      const chId = cleanId(c.url || c.id || c.chapterId || `${num}`);

      return {
        id: chId,
        name: chName,
        num,
        releaseAt: c.dateUpload || c.date || null,
      };
    });

    // Sort chapters ascending by number
    parsed.sort((a, b) => {
      if (a.num !== null && b.num !== null) return a.num - b.num;
      return 0;
    });

    return parsed;
  },

  async chapterPages(mangaId, chapterId) {
    const rawChapterId = cleanId(chapterId);
    const raw = await shig(`/manga/chapter/${rawChapterId}/pages`);
    const pages = Array.isArray(raw) ? raw : (raw?.pages || raw?.images || []);

    return pages.map((p, i) => {
      const rawUrl = typeof p === 'string' ? p : (p.imageUrl || p.url || p.src || '');
      return {
        id: `page-${i + 1}`,
        pageNumber: i + 1,
        url: this.imageProxy(rawUrl),
        rawUrl,
      };
    });
  },

  imageProxy(rawUrl) {
    if (!rawUrl) return '';
    if (rawUrl.startsWith(SHINIGAMI_BASE)) return rawUrl;
    return `${SHINIGAMI_BASE}/manga/image?url=${encodeURIComponent(rawUrl)}`;
  },

  thumb(url) {
    return this.imageProxy(url);
  },

  rawUrlOf(proxied) {
    if (!proxied) return null;
    const m = proxied.match(/url=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }
};
