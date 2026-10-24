import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../store';
import { MangaCard, MangaGrid } from '../components/MangaCard';
import { Spinner, ErrorState } from '../components/ui';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

const TYPES = ['Semua', 'Manga', 'Manhwa', 'Manhua', 'Berwarna'];
const KINDS = [
  { key: 'popular', label: 'Populer' },
  { key: 'latest', label: 'Terbaru' },
  { key: 'recommend', label: 'Rekomendasi' },
  { key: 'library', label: 'Koleksi Pustaka' },
  { key: 'colored', label: 'Edisi Berwarna' },
];

export function Pustaka() {
  const { sourceKey } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { sourceList, sourceKey: globalSourceKey } = useApp();

  const currentKey = sourceKey || globalSourceKey;
  const activeSource = sourceList[currentKey] || sourceList.shinigami;

  const page = parseInt(searchParams.get('page') || '1', 10);
  const selectedKind = searchParams.get('jenis') || 'popular';
  const selectedType = searchParams.get('tipe') || 'Semua';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');

    activeSource
      .list({
        kind: selectedKind,
        page,
        type: selectedType === 'Semua' ? undefined : selectedType,
      })
      .then((res) => {
        if (!alive) return;
        setItems(res.items || []);
        setHasMore(res.hasMore);
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'Gagal memuat pustaka komik.');
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [activeSource, page, selectedKind, selectedType]);

  const updateParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val && val !== 'Semua') {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">
      {/* Title Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23232c] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#e11d48]" />
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-sans">
              Pustaka Komik
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            Katalog lengkap manga, manhwa & manhua dari sumber {activeSource.name}
          </p>
        </div>

        {/* Source indicator */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-neutral-500">Sumber:</span>
          <span className="border border-[#e11d48] bg-[#e11d48]/10 text-[#e11d48] px-2 py-0.5 font-bold uppercase">
            {activeSource.name}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="mb-8 p-4 border border-[#23232c] bg-[#121216] space-y-4">
        {/* Kind Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono uppercase text-neutral-500 mr-2">
            Kategori Feed:
          </span>
          {KINDS.map((k) => {
            const isActive = selectedKind === k.key;
            return (
              <button
                key={k.key}
                onClick={() => updateParam('jenis', k.key)}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border transition-colors ${
                  isActive
                    ? 'border-[#e11d48] bg-[#e11d48] text-white'
                    : 'border-[#282834] bg-[#16161c] text-neutral-400 hover:text-white hover:border-[#383846]'
                }`}
              >
                {k.label}
              </button>
            );
          })}
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#1c1c24]">
          <span className="text-[10px] font-mono uppercase text-neutral-500 mr-2">
            Tipe Format:
          </span>
          {TYPES.map((t) => {
            const isActive = selectedType === t;
            return (
              <button
                key={t}
                onClick={() => updateParam('tipe', t)}
                className={`px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider border transition-colors ${
                  isActive
                    ? 'border-[#f59e0b] bg-[#f59e0b] text-neutral-950 font-bold'
                    : 'border-[#282834] bg-[#16161c] text-neutral-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      {error && (
        <ErrorState
          message={error}
          onRetry={() => {
            setLoading(true);
            setError('');
            activeSource
              .list({ kind: selectedKind, page, type: selectedType === 'Semua' ? undefined : selectedType })
              .then((res) => {
                setItems(res.items || []);
                setHasMore(res.hasMore);
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
        <Spinner label={`Mengambil katalog dari ${activeSource.name}`} />
      ) : items.length === 0 ? (
        <div className="py-20 text-center border border-[#23232c] bg-[#121216] my-6">
          <p className="text-xs font-mono text-neutral-400">
            Tidak ada komik yang ditemukan untuk filter ini.
          </p>
        </div>
      ) : (
        <>
          <MangaGrid>
            {items.map((m, idx) => (
              <MangaCard key={`${m.id}-${idx}`} manga={m} />
            ))}
          </MangaGrid>

          {/* Pagination Controls */}
          <div className="mt-12 flex items-center justify-center gap-3 border-t border-[#23232c] pt-6">
            <button
              onClick={() => updateParam('page', String(Math.max(1, page - 1)))}
              disabled={page <= 1}
              className="flex items-center gap-1.5 border border-[#282834] bg-[#16161c] px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Halaman Sebelumnya</span>
            </button>

            <span className="px-3 py-2 border border-[#23232c] bg-[#121216] text-xs font-mono font-bold text-neutral-200">
              Hal. {page}
            </span>

            <button
              onClick={() => updateParam('page', String(page + 1))}
              disabled={!hasMore && currentKey !== 'shinigami'}
              className="flex items-center gap-1.5 border border-[#282834] bg-[#16161c] px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <span>Halaman Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
