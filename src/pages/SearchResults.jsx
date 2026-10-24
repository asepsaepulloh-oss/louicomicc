import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { MangaCard, MangaGrid } from '../components/MangaCard';
import { Spinner, ErrorState } from '../components/ui';
import { Search, ArrowRight } from 'lucide-react';

export function SearchResults() {
  const { sourceKey } = useParams();
  const [searchParams] = useSearchParams();
  const { sourceList, sourceKey: globalSourceKey, setSourceKey } = useApp();
  const navigate = useNavigate();

  const currentKey = sourceKey || globalSourceKey;
  const activeSource = sourceList[currentKey] || sourceList.shinigami;
  const otherKey = currentKey === 'shinigami' ? 'komiku' : 'shinigami';
  const otherSource = sourceList[otherKey];

  const query = searchParams.get('q') || '';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    if (!query.trim()) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    activeSource
      .list({ q: query.trim(), page: 1 })
      .then((res) => {
        if (!alive) return;
        setItems(res?.items || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'Gagal mencari komik.');
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [activeSource, query]);

  const switchToOther = () => {
    setSourceKey(otherKey);
    navigate(`/${otherKey}/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23232c] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-[#e11d48]" />
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-sans">
              Hasil Pencarian: &quot;{query}&quot;
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            Ditemukan {items.length} judul dari sumber {activeSource.name}
          </p>
        </div>

        {/* Quick switch to alternative API */}
        <button
          onClick={switchToOther}
          className="flex items-center gap-2 border border-[#282834] bg-[#16161c] px-3.5 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 hover:border-[#e11d48] hover:text-white transition-colors"
        >
          <span>Cari juga di {otherSource?.name}</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#e11d48]" />
        </button>
      </div>

      {error && (
        <ErrorState
          message={error}
          onRetry={() => {
            setLoading(true);
            setError('');
            activeSource
              .list({ q: query.trim(), page: 1 })
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
        <Spinner label={`Mencari "${query}" di ${activeSource.name}`} />
      ) : items.length === 0 ? (
        <div className="py-20 text-center border border-[#23232c] bg-[#121216] my-6">
          <p className="text-sm font-semibold text-neutral-300 mb-1">
            Tidak ada komik yang sesuai dengan pencarian Anda.
          </p>
          <p className="text-xs font-mono text-neutral-500 mb-4">
            Coba kata kunci lain atau periksa sumber API {otherSource?.name}.
          </p>
          <button
            onClick={switchToOther}
            className="border border-[#e11d48] bg-[#e11d48] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
          >
            Coba cari di {otherSource?.name}
          </button>
        </div>
      ) : (
        <MangaGrid>
          {items.map((m, idx) => (
            <MangaCard key={`${m.id}-${idx}`} manga={m} />
          ))}
        </MangaGrid>
      )}
    </div>
  );
}
