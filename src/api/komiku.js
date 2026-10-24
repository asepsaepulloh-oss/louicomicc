const KOMIKU_BASE = 'https://komiku-rest-api-one.vercel.app';

/**
 * Fetch helper for Komiku. Tolerates the mixed envelope styles:
 * raw arrays, `{ success/data }`, `{ status/data }` and `{ manga: { items } }`.
 */
async function komiku(path) {
  const res = await fetch(`${KOMIKU_BASE}${path}`);
  if (!res.ok) throw new Error(`Komiku API ${res.status}`);
  const json = await res.json();
  const data = Array.isArray(json) ? json : json?.data ?? json?.manga ?? json;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.mangas)) return data.mangas;
  return data;
}

/** Derive a stable chapter number from a title like "Chapter 148" / "Awal: Chapter 1". */
function chapterNumber(title = '') {
  const m = String(title).match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

/** Normalize one raw Komiku item into a common shape. */
function komiItem(raw) {
  const latestTitle = raw.latestChapterTitle ?? raw.latestChapter ?? raw.chapters?.latest?.chapter ?? null;
  const latestNum = latestTitle ? chapterNumber(latestTitle.replace(/^Terbaru: /, '')) : null;
  return {
    source: 'komiku',
    id: raw.mangaSlug || raw.slug || raw.apiDetailLink?.split('/').filter(Boolean).pop() || raw.title,
    title: raw.title,
    thumbnail: raw.thumbnail,
    type: raw.type || 'Manga',
    genre: raw.genre ? String(raw.genre).split(/,|\s*\|\s*/).map((g) => g.trim()).filter(Boolean) : [],
    status: 'Unknown',
    isColored: raw.isColored === true,
    updateTime: raw.updateTime || raw.updateCountText || '',
    latestChapter: raw.latestChapter ? { num: latestNum, title: raw.latestChapter } : latestNum ? { num: latestNum, title: `Chapter ${latestNum}` } : null,
  };
}

export const komiku = {
  key: 'komiku',
  name: 'Komiku',

  /**
   * Kind-based listing: 'popular' | 'latest' | 'recommend' | 'library' | 'colored' | 'search' | 'genre'
   */
  async list({ kind = 'popular', q, genre } = {}) {
    let items;
    switch (kind) {
      case 'latest':
        items = await komiku('/terbaru');
        break;
      case 'recommend':
        items = await komiku('/rekomendasi');
        break;
      case 'library':
        items = await komiku('/pustaka');
        break;
      case 'colored':
        items = await komiku('/berwarna');
        break;
      case 'search':
        items = await komiku(`/search?q=${encodeURIComponent(q)}`);
        break;
      case 'genre':
        items = await komiku(`/genre/${genre}`);
        break;
      default:
        items = await komiku('/komik-populer');
    }
    return { items: items.map(komiItem), page: 1, hasMore: false };
  },

  async genres() {
    const raw = await komiku('/genre-all');
    return raw.map((g) => ({ key: g.slug, title: g.titleAttr || g.title.replace(/\s*\([\d.]+\)\s*$/, '') || g.title }));
  },

  async detail(slug) {
    const d = await (async () => {
      const res = await fetch(`${KOMIKU_BASE}/detail-komik/${slug}`);
      if (!res.ok) throw new Error(`Komiku API ${res.status}`);
      return res.json();
    })();
    return {
      source: 'komiku',
      id: d.slug || slug,
      title: d.title,
      altTitle: d.alternativeTitle || d.info?.['Judul Alternatif'] || '',
      thumbnail: d.thumbnail,
      author: d.info?.['Author'] || d.author || '',
      status: d.info?.['Status'] || d.status || 'Unknown',
      genre: Array.isArray(d.genres) ? d.genres : d.info?.['Genre'] ? String(d.info['Genre']).split(/\s+/).filter(Boolean) : [],
      type: d.info?.['Tipe'] || d.type || 'Manga',
      description: d.sinopsis || d.description || '',
    };
  },

  async chapters(slug) {
    const d = await (async () => {
      const res = await fetch(`${KOMIKU_BASE}/detail-komik/${slug}`);
      if (!res.ok) throw new Error(`Komiku API ${res.status}`);
      return res.json();
    })();
    const raw = d.chapters || [];
    const parsed = raw.map((c) => {
      const num = chapterNumber(c.title) ?? Number(c.chapterNumber);
      return {
        id: `${slug}/${num}`,
        num,
        name: c.title,
        releaseAt: c.date ? Date.parse(c.date.split('/').length === 3 ? [c.date.split('/')[2], c.date.split('/')[0], c.date.split('/')[1]].join('-') : c.date) : undefined,
        raw: c,
      };
    });
    parsed.sort((a, b) => (a.num ?? -1) - (b.num ?? -1));
    return parsed;
  },

  async chapterPages(mangaSlug, chapter) {
    const d = await (async () => {
      const res = await fetch(`${KOMIKU_BASE}/baca-chapter/${mangaSlug}/${chapter}`);
      if (!res.ok) throw new Error(`Komiku API ${res.status}`);
      return res.json();
    })();
    return (d.images || []).map((img) => ({
      id: img.id,
      url: this.imageProxy(img.src),
      fallback: img.fallbackSrc || img.src,
    }));
  },

  imageProxy(rawUrl) {
    return `${KOMIKU_BASE}/image-proxy?url=${encodeURIComponent(rawUrl)}`;
  },

  /** Komiku thumbnail CDN serves hotlinked images fine; proxy only when broken. */
  thumb(url) {
    return url;
  },

  /** Used by Image component to fall back to the raw URL if the proxy fails. */
  rawUrlOf(proxied) {
    const m = proxied.match(/^https:\/\/[^/]+\/image-proxy\?url=(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  },
};
