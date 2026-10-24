import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { MangaCard, MangaGrid } from '../components/MangaCard';
import { SmartImg, Spinner, ErrorState } from '../components/ui';

const QUICK_FILTERS = ['Semua', 'Manga', 'Manhwa', 'Manhua', 'Berwarna'];

export function Home() {
  const { source, sourceKey } = useApp();
  const navigate = useNavigate();

  const [filter, setFilter] = useState('Semua');
  const [featured, setFeatured] = useState([]);
  const [popular, setPopular] = useState([]);
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    setFilter('Semua');

    // Featured + popular + latest come from the two primary feeds.
    Promise.all([
      source.list({ kind: 'popular', page: 1 }),
      source.list({ kind: 'latest', page: 1 }),
    ])
      .then(([pop, lat]) => {
        if (!alive) return;
        setFeatured(pop.items.slice(0, 1));
        setPopular(pop.items);
        setLatest(lat.items);
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'Gagal memuat data.');
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [source]);

  const showAll = (items) =>
    filter === 'Semua'
      ? items
      : items.filter((m) => {
          if (filter === 'Berwarna') return m.isColored || m.type === 'Berwarna';
          return m.type.toLowerCase() === filter.toLowerCase();
        });

  return (
    <div className="mx-auto max-w-[1400px] px-4">
      {error && <ErrorState message={error} />}

      {loading ? (
        <Spinner />
      ) : (
        <>
          {/* Hero banner */}
          {featured.length > 0 && <Hero banner={featured[0]} />}

          {/* Quick filters */}
          <div className="my-8 flex flex-wrap items-center gap-2">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  filter === f
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]'
                    : 'border-[var(--border)] text-neutral-400 hover:border-neutral-500 hover:text-neutral-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <Section
            title="Populer"
            items={showAll(popular)}
            sourceKey={sourceKey}
            navigate={navigate}
            onSeeMore={popular.length > 12}
          />

          <Section
            title="Rilis Terbaru"
            items={showAll(latest)}
            sourceKey={sourceKey}
            navigate={navigate}
            onSeeMore={latest.length > 12}
          />
        </>
      )}
    </div>
  );
}

function Hero({ banner }) {
  const { sourceKey } = useApp();
  const navigate = useNavigate();
  const id = banner.id;
  const route = `/${sourceKey}/manga/${encodeURIComponent(id)}`;
  return (
    <section className="relative mb-10 overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto]">
        <div className="max-w-xl p-6 md:p-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            Unggulan
          </p>
          <h1 className="mb-3 text-2xl font-black leading-tight md:text-4xl">
            {banner.title}
          </h1>
          <p className="mb-4 line-clamp-3 text-sm text-neutral-400">
            {banner.genre?.length ? banner.genre.join(' · ') : banner.type}
          </p>
          <button
            onClick={() => navigate(route)}
            className="border border-[var(--accent)] bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--bg)] transition-opacity hover:opacity-90"
          >
            Mulai Membaca
          </button>
        </div>
        <div className="relative hidden md:block">
          <SmartImg
            src={sourceKey === 'shinigami' ? banner.thumbnail : banner.thumbnail}
            alt={banner.title}
            className="h-full w-72 object-cover object-top"
            style={{ maxHeight: 280 }}
          />
        </div>
      </div>
    </section>
  );
}

function Section({ title, items, onSeeMore, navigate, sourceKey }) {
  const sliced = items.slice(0, 12);
  if (!sliced.length) return null;
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="border-l-4 border-[var(--accent)] pl-3 text-lg font-bold uppercase tracking-wide">
          {title}
        </h2>
        {onSeeMore && (
          <button
            onClick={() => navigate(`/${sourceKey}/daftar?jenis=populer`)}
            className="text-xs font-semibold uppercase tracking-wider text-neutral-500 transition-colors hover:text-[var(--accent)]"
          >
            Lihat Semua →
          </button>
        )}
      </div>
      <MangaGrid>
        {sliced.map((m, i) => (
          <MangaCard key={`${m.id}-${i}`} manga={m} />
        ))}
      </MangaGrid>
    </section>
  );
}
