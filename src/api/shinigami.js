const SHINIGAMI_BASE = 'https://apis.louiv.me/api';

/**
 * Minimal fetch wrapper that unwraps Shinigami's `{ success, data }` envelope.
 * @param {string} path
 * @param {object} params - query params, undefined values are dropped
 */
async function shig(path, params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  const url = `${SHINIGAMI_BASE}${path}${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Shinigami API ${res.status}`);
  const json = await res.json();
  if (json && json.success === false) throw new Error(json.message || 'Shinigami API error');
  return json.data;
}

const chapterKey = (num) => (num !== null && num !== undefined ? num : -1);

/** Normalize one raw manga item into a common shape. */
function shigItem(raw, extra = {}) {
  const status = (raw.status || '').toLowerCase();
  return {
    source: 'shinigami',
    id: raw.url,
    title: raw.title,
    thumbnail: raw.thumbnail,
    type: extra.type || 'Manga',
    genre: raw.genre ? raw.genre.split(',').map((g) => g.trim()) : [],
    status: raw.status || (status === 'ongoing' ? 'Ongoing' : status === 'completed' ? 'Completed' : 'Unknown'),
    latestChapter: extra.latestChapter ?? null,
  };
}

export const shinigami = {
  key: 'shinigami',
  name: 'Shinigami',

  /** Popular / latest manga list (paginated). */
  async list({ kind = 'popular', page = 1, q, type } = {}) {
    let data;
    if (kind === 'latest') data = await shig('/manga/latest', { page });
    else if (q) data = await shig('/manga/search', { q, page });
    else data = await shig('/manga/popular', { page });
    let items = (data.mangas || []).map((m) => shigItem(m, { type }));
    if (type) items = items.filter((m) => m.type.toLowerCase() === type.toLowerCase());
    return { items, page, hasMore: !!data.hasNextPage };
  },

  async detail(id) {
    const d = await shig(`/manga/${id}`);
    return {
      source: 'shinigami',
      id,
      title: d.title,
      altTitle: d.alternativeTitle || '',
      thumbnail: d.thumbnail,
      author: d.author,
      artist: d.artist,
      status: d.status || 'Unknown',
      genre: d.genre ? d.genre.split(',').map((g) => g.trim()) : [],
      type: d.type || (d.genre ? d.genre.split(',').find((g) => ['Manga', 'Manhwa', 'Manhua', 'Korean', 'Chinese', 'Japanese'].includes(g)) : 'Manga'),
      description: d.description || '',
    };
  },

  async chapters(id) {
    const raw = await shig(`/manga/${id}/chapters`);
    const parsed = raw.map((c) => {
      const m = String(c.name).match(/(\d+(?:\.\d+)?)\D*$/);
      return {
        id: c.url,
        name: c.name,
        number: m ? parseFloat(m[1]) : null,
        releaseAt: c.dateUpload,
      };
    });
    parsed.sort((a, b) => (chapterKey(a.number) - chapterKey(b.number)) || a.releaseAt - b.releaseAt);
    return parsed;
  },

  async chapterPages(mangaId, chapterId) {
    const raw = await shig(`/manga/chapter/${chapterId}/pages`);
    return raw.map((p, i) => ({ id: `${i}`, url: this.imageProxy(p.imageUrl) }));
  },

  imageProxy(rawUrl) {
    return `${SHINIGAMI_BASE}/manga/image?url=${encodeURIComponent(rawUrl)}`;
  },

  thumb(url) {
    return this.imageProxy(url);
  },
};
