import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { MangaCard, MangaGrid } from '../components/MangaCard';
import { Spinner, ErrorState } from '../components/ui';
import { Layers, ChevronRight, Tag } from 'lucide-react';

const COMMON_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Isekai',
  'Martial Arts', 'Mystery', 'Psychological', 'Romance', 'School Life',
  'Sci-Fi', 'Seinen', 'Shounen', 'Slice of Life', 'Supernatural', 'Thriller'
];

export function Genre() {
  const { sourceKey, genreSlug } = useParams();
  const { sourceList, sourceKey: globalSourceKey } = useApp();
  const navigate = useNavigate();

  const currentKey = sourceKey || globalSourceKey;
  const activeSource = sourceList[currentKey] || sourceList.shinigami;

  const [genres, setGenres] = useState([]);
  const [activeGenre, setActiveGenre] = useState(genreSlug || '');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genreListLoading, setGenreListLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch available genres
  useEffect(() => {
    let alive = true;
    setGenreListLoading(true);

    if (activeSource.genres) {
      activeSource.genres()
        .then((list) => {
          if (!alive) return;
          if (list && list.length > 0) {
            setGenres(list);
            if (!activeGenre && !genreSlug) {
              setActiveGenre(list[0].key);
            }
          } else {
            setGenres(COMMON_GENRES.map(g => ({ key: g.toLowerCase(), title: g })));
            if (!activeGenre && !genreSlug) setActiveGenre(COMMON_GENRES[0].toLowerCase());
          }
          setGenreListLoading(false);
        })
        .catch(() => {
          if (!alive) return;
          setGenres(COMMON_GENRES.map(g => ({ key: g.toLowerCase(), title: g })));
          if (!activeGenre && !genreSlug) setActiveGenre(COMMON_GENRES[0].toLowerCase());
          setGenreListLoading(false);
        });
    } else {
      setGenres(COMMON_GENRES.map(g => ({ key: g.toLowerCase(), title: g })));
      if (!activeGenre && !genreSlug) setActiveGenre(COMMON_GENRES[0].toLowerCase());
      setGenreListLoading(false);
    }

    return () => {
      alive = false;
    };
  }, [activeSource]);

  // Keep activeGenre in sync with URL
  useEffect(() => {
    if (genreSlug) {
      setActiveGenre(genreSlug);
    }
  }, [genreSlug]);

  // Fetch manga for the active genre
  useEffect(() => {
    if (!activeGenre) return;

    let alive = true;
    setLoading(true);
    setError('');

    // If source is Komiku, kind 'genre' is supported.
    // If Shinigami, we can query list or search with the genre name
    const fetchPromise = currentKey === 'komiku'
      ? activeSource.list({ kind: 'genre', genre: activeGenre })
      : activeSource.list({ q: activeGenre, page: 1 });

    fetchPromise
      .then((res) => {
        if (!alive) return;
        setItems(res?.items || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'Gagal memuat komik untuk genre ini.');
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [activeSource, activeGenre, currentKey]);

  const selectGenre = (slug) => {
    setActiveGenre(slug);
    navigate(`/${currentKey}/genre/${encodeURIComponent(slug)}`);
  };

  const selectedTitle = genres.find(g => g.key === activeGenre)?.title || activeGenre;

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">
      {/* Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23232c] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#e11d48]" />
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-sans">
              Eksplorasi Genre
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            Jelajahi berbagai genre komik di sumber {activeSource.name}
          </p>
        </div>

        <div className="text-xs font-mono text-neutral-400">
          Genre Aktif:{' '}
          <span className="text-[#e11d48] font-bold uppercase">{selectedTitle || '-'}</span>
        </div>
      </div>

      {/* Genre Chips Grid */}
      <div className="mb-8 p-4 border border-[#23232c] bg-[#121216]">
        <div className="flex items-center gap-2 mb-3 text-[10px] font-mono uppercase tracking-wider text-neutral-500">
          <Tag className="w-3.5 h-3.5" />
          <span>Daftar Genre:</span>
        </div>

        {genreListLoading ? (
          <div className="py-4 text-xs font-mono text-neutral-500">Memuat genre…</div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {genres.map((g) => {
              const isSelected = activeGenre?.toLowerCase() === g.key.toLowerCase();
              return (
                <button
                  key={g.key}
                  onClick={() => selectGenre(g.key)}
                  className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider border transition-colors ${
                    isSelected
                      ? 'border-[#e11d48] bg-[#e11d48] text-white font-bold'
                      : 'border-[#282834] bg-[#16161c] text-neutral-400 hover:text-white hover:border-neutral-500'
                  }`}
                >
                  {g.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Manga Grid for Chosen Genre */}
      {error && (
        <ErrorState
          message={error}
          onRetry={() => {
            setLoading(true);
            setError('');
            const fetchPromise = currentKey === 'komiku'
              ? activeSource.list({ kind: 'genre', genre: activeGenre })
              : activeSource.list({ q: activeGenre, page: 1 });
            fetchPromise
              .then((res) => {
                setItems(res?.items || []);
                setLoading(false);
              })
              .catch((err) => {
                setError(err.message);
                setLoading(false);
              });
          }}
        />
      )}

      {loading ? (
        <Spinner label={`Mengambil komik genre "${selectedTitle}"`} />
      ) : items.length === 0 ? (
        <div className="py-20 text-center border border-[#23232c] bg-[#121216]">
          <p className="text-xs font-mono text-neutral-400">
            Tidak ada komik yang ditemukan untuk genre &quot;{selectedTitle}&quot;.
          </p>
        </div>
      ) : (
        <section>
          <div className="mb-4 flex items-center justify-between border-b border-[#23232c] pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
              Hasil Komik ({items.length})
            </h2>
          </div>
          <MangaGrid>
            {items.map((m, idx) => (
              <MangaCard key={`${m.id}-${idx}`} manga={m} />
            ))}
          </MangaGrid>
        </section>
      )}
    </div>
  );
}
