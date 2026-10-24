const KOMIKU_HOSTS = [
  'https://komiku-rest-api-one.vercel.app',
  'https://komiku-rest-api.vercel.app',
];

let activeHostIndex = 0;

function getBase() {
  return KOMIKU_HOSTS[activeHostIndex];
}

/**
 * Fetch helper for Komiku with automatic host failover and timeout.
 */
async function fetchKomiku(path) {
  let lastError = null;

  for (let i = 0; i < KOMIKU_HOSTS.length; i++) {
    const hostIdx = (activeHostIndex + i) % KOMIKU_HOSTS.length;
    const base = KOMIKU_HOSTS[hostIdx];
    const url = `${base}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      activeHostIndex = hostIdx; // stick to working host
      
      const data = Array.isArray(json) ? json : json?.data ?? json?.manga ?? json?.results ?? json;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.items)) return data.items;
      if (data && Array.isArray(data.mangas)) return data.mangas;
      if (data && Array.isArray(data.results)) return data.results;
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
    }
  }

  throw new Error(`Gagal menghubungi Komiku API: ${lastError?.message || 'Server sibuk'}`);
}

function chapterNumber(title = '') {
  const m = String(title).match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

function komiItem(raw) {
  const latestTitle = raw.latestChapterTitle ?? raw.latestChapter ?? raw.chapters?.latest?.chapter ?? null;
  const latestNum = latestTitle ? chapterNumber(String(latestTitle).replace(/^Terbaru: /i, '')) : null;
  
  let genre = [];
  if (Array.isArray(raw.genre)) genre = raw.genre;
  else if (raw.genre) genre = String(raw.genre).split(/,|\s*\|\s*/).map((g) => g.trim()).filter(Boolean);

  let type = raw.type;
  if (!type) {
    if (raw.isColored) type = 'Berwarna';
    else if (genre.some(g => /manhwa/i.test(g))) type = 'Manhwa';
    else if (genre.some(g => /manhua/i.test(g))) type = 'Manhua';
    else type = 'Manga';
  }

  const id = raw.mangaSlug || raw.slug || (raw.apiDetailLink ? raw.apiDetailLink.split('/').filter(Boolean).pop() : '') || raw.id || raw.title;

  return {
    source: 'komiku',
    id: String(id).replace(/^\/?detail-komik\//, '').replace(/^\//, ''),
    title: raw.title || 'Tanpa Judul',
    thumbnail: raw.thumbnail || '',
    type,
    genre,
    status: raw.status || 'Ongoing',
    isColored: raw.isColored === true || type === 'Berwarna',
    updateTime: raw.updateTime || raw.updateCountText || '',
    latestChapter: latestNum ? { num: latestNum, title: latestTitle || `Chapter ${latestNum}` } : null,
  };
}

export const komiku = {
  key: 'komiku',
  name: 'Komiku',

  /**
   * Kind-based listing: 'popular' | 'latest' | 'recommend' | 'library' | 'colored' | 'search' | 'genre'
   */
  async list({ kind = 'popular', page = 1, q, genre, type } = {}) {
    let items;
    if (q) {
      items = await fetchKomiku(`/search?q=${encodeURIComponent(q)}`);
    } else if (genre) {
      items = await fetchKomiku(`/genre/${encodeURIComponent(genre)}`);
    } else if (kind === 'latest') {
      items = await fetchKomiku('/terbaru');
    } else if (kind === 'recommend') {
      items = await fetchKomiku('/rekomendasi');
    } else if (kind === 'library' || kind === 'pustaka') {
      items = await fetchKomiku('/pustaka');
    } else if (kind === 'colored' || kind === 'berwarna') {
      items = await fetchKomiku('/berwarna');
    } else {
      // Default: popular
      items = await fetchKomiku('/komik-populer');
    }

    const rawList = Array.isArray(items) ? items : (items?.results || items?.items || items?.data || []);
    let normalized = rawList.map(komiItem);

    if (type && type !== 'Semua') {
      normalized = normalized.filter((m) => {
        if (type.toLowerCase() === 'berwarna') return m.isColored;
        return m.type.toLowerCase() === type.toLowerCase();
      });
    }

    return {
      items: normalized,
      page: Number(page),
      hasMore: false,
    };
  },

  async genres() {
    const raw = await fetchKomiku('/genre-all');
    const list = Array.isArray(raw) ? raw : (raw?.results || raw?.genres || []);
    return list.map((g) => ({
      key: g.slug || g.endpoint || g.title?.toLowerCase().replace(/\s+/g, '-'),
      title: g.titleAttr || g.title?.replace(/\s*\([\d.]+\)\s*$/, '') || g.name || g.slug,
    }));
  },

  async detail(slug) {
    const cleanSlug = String(slug).replace(/^\/?detail-komik\//, '').replace(/^\//, '');
    const d = await fetchKomiku(`/detail-komik/${encodeURIComponent(cleanSlug)}`);
    
    let genres = [];
    if (Array.isArray(d.genres)) genres = d.genres;
    else if (d.info?.['Genre']) genres = String(d.info['Genre']).split(/\s+/).filter(Boolean);
    else if (d.genre) genres = Array.isArray(d.genre) ? d.genre : String(d.genre).split(',').map(s => s.trim());

    return {
      source: 'komiku',
      id: d.slug || cleanSlug,
      title: d.title || 'Tanpa Judul',
      altTitle: d.alternativeTitle || d.info?.['Judul Alternatif'] || '',
      thumbnail: d.thumbnail || '',
      author: d.info?.['Author'] || d.author || 'Tidak diketahui',
      artist: d.info?.['Artist'] || d.artist || '',
      status: d.info?.['Status'] || d.status || 'Ongoing',
      genre: genres,
      type: d.info?.['Tipe'] || d.type || (genres.some(g => /manhwa/i.test(g)) ? 'Manhwa' : 'Manga'),
      description: d.sinopsis || d.description || 'Belum ada sinopsis untuk komik ini.',
    };
  },

  async chapters(slug) {
    const cleanSlug = String(slug).replace(/^\/?detail-komik\//, '').replace(/^\//, '');
    const d = await fetchKomiku(`/detail-komik/${encodeURIComponent(cleanSlug)}`);
    const raw = d.chapters || d.chapter || [];
    
    const parsed = raw.map((c) => {
      const num = chapterNumber(c.title) ?? (c.chapterNumber ? Number(c.chapterNumber) : null);
      // Determine chapter slug or number for reading endpoint
      let chapterSlug = c.endpoint ? c.endpoint.replace(/^\/?baca-chapter\//, '') : '';
      if (!chapterSlug) {
        chapterSlug = `${num}`;
      } else {
        // usually format is manga-slug/chapter-xx
        const parts = chapterSlug.split('/').filter(Boolean);
        chapterSlug = parts.pop() || `${num}`;
      }

      return {
        id: chapterSlug,
        num,
        name: c.title || `Chapter ${num ?? ''}`,
        releaseAt: c.date ? Date.parse(c.date.split('/').length === 3 ? [c.date.split('/')[2], c.date.split('/')[0], c.date.split('/')[1]].join('-') : c.date) : null,
      };
    });

    parsed.sort((a, b) => (a.num ?? 0) - (b.num ?? 0));
    return parsed;
  },

  async chapterPages(mangaSlug, chapter) {
    const cleanSlug = String(mangaSlug).replace(/^\/?detail-komik\//, '').replace(/^\//, '');
    const cleanCh = String(chapter).replace(/^\/?baca-chapter\//, '').replace(new RegExp(`^${cleanSlug}\\/`), '');
    
    const d = await fetchKomiku(`/baca-chapter/${encodeURIComponent(cleanSlug)}/${encodeURIComponent(cleanCh)}`);
    const list = d.images || d.chapter_image || d.data?.images || [];
    
    return list.map((img, i) => {
      const rawSrc = typeof img === 'string' ? img : (img.src || img.url || img.image || '');
      const fallbackSrc = typeof img === 'object' && img.fallbackSrc ? img.fallbackSrc : rawSrc;
      return {
        id: `page-${i + 1}`,
        pageNumber: i + 1,
        url: this.imageProxy(rawSrc),
        rawUrl: rawSrc,
        fallback: fallbackSrc,
      };
    });
  },

  imageProxy(rawUrl) {
    if (!rawUrl) return '';
    const base = getBase();
    if (rawUrl.startsWith(base)) return rawUrl;
    return `${base}/image-proxy?url=${encodeURIComponent(rawUrl)}`;
  },

  thumb(url) {
    return url;
  },

  rawUrlOf(proxied) {
    if (!proxied) return null;
    const m = proxied.match(/url=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  },
};
