import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../store';
import { MangaCard, MangaGrid } from '../components/MangaCard';
import { SmartImg, Spinner, ErrorState } from '../components/ui';
import { BookOpen, Flame, ChevronLeft, ChevronRight, Play, Sparkles } from 'lucide-react';

const QUICK_FILTERS = ['Semua', 'Manga', 'Manhwa', 'Manhua', 'Berwarna'];

export function Home() {
  const { source, sourceKey, history } = useApp();
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

    // Fetch both popular and latest feeds simultaneously
    Promise.all([
      source.list({ kind: 'popular', page: 1 }),
      source.list({ kind: 'latest', page: 1 }),
    ])
      .then(([pop, lat]) => {
        if (!alive) return;
        const popItems = pop?.items || [];
        const latItems = lat?.items || [];
        
        setFeatured(popItems.slice(0, 5));
        setPopular(popItems);
        setLatest(latItems);
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'Gagal memuat feed komik.');
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [source]);

  const filterItems = (items) => {
    if (filter === 'Semua') return items;
    return items.filter((m) => {
      if (filter === 'Berwarna') return m.isColored || m.type === 'Berwarna';
      return m.type?.toLowerCase() === filter.toLowerCase();
    });
  };

  const filteredPopular = filterItems(popular);
  const filteredLatest = filterItems(latest);

  // Check recent reading history
  const recentHistory = history?.entries?.slice(0, 4) || [];

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">
      {error && (
        <ErrorState
          message={error}
          onRetry={() => {
            setError('');
            setLoading(true);
            Promise.all([
              source.list({ kind: 'popular', page: 1 }),
              source.list({ kind: 'latest', page: 1 }),
            ])
              .then(([pop, lat]) => {
                setFeatured(pop.items.slice(0, 5));
                setPopular(pop.items);
                setLatest(lat.items);
                setLoading(false);
              })
              .catch((err) => {
                setError(err.message || 'Gagal memuat data');
                setLoading(false);
              });
          }}
        />
      )}

      {loading ? (
        <Spinner label={`Mengambil komik dari ${source.name}`} />
      ) : (
        <>
          {/* Hero Featured Banner / Carousel */}
          {featured.length > 0 && <HeroCarousel items={featured} />}

          {/* Quick Continue Reading bar if history exists */}
          {recentHistory.length > 0 && (
            <section className="mb-10 border border-[#23232c] bg-[#121216] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 border-b border-[#1f1f28] pb-2.5">
                <div className="flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 text-[#e11d48] fill-current" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-200">
                    Lanjutkan Membaca
                  </h2>
                </div>
                <Link
                  to="/riwayat"
                  className="text-[11px] font-mono text-neutral-400 hover:text-[#e11d48] transition-colors"
                >
                  Semua Riwayat ({history.entries.length}) →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {recentHistory.map((item) => (
                  <Link
                    key={`${item.source}-${item.id}`}
                    to={`/${item.source}/manga/${encodeURIComponent(item.id)}/baca/${encodeURIComponent(item.chapterId)}`}
                    className="flex items-center gap-3 p-2 border border-[#23232c] bg-[#16161c] hover:border-[#e11d48] transition-colors group"
                  >
                    <div className="w-12 h-16 shrink-0 bg-[#0a0a0c] overflow-hidden">
                      <SmartImg
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-neutral-200 truncate group-hover:text-[#e11d48] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-[#e11d48] font-mono mt-0.5 truncate font-semibold">
                        {item.chapterTitle}
                      </p>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase">
                        Sumber: {item.source}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Quick Category Filters */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-[#23232c] pb-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 mr-1 hidden sm:inline">
                Kategori:
              </span>
              {QUICK_FILTERS.map((f) => {
                const isActive = filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    aria-pressed={isActive}
                    className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-all border ${
                      isActive
                        ? 'border-[#e11d48] bg-[#e11d48] text-white shadow-sm'
                        : 'border-[#23232c] bg-[#121216] text-neutral-400 hover:text-white hover:border-[#383846]'
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] font-mono text-neutral-500">
              Menampilkan sumber <span className="text-neutral-300 font-semibold">{source.name}</span>
            </div>
          </div>

          {/* Popular Section */}
          <SectionBlock
            title="Populer Saat Ini"
            items={filteredPopular.slice(0, 12)}
            sourceKey={sourceKey}
            onSeeMore={() => navigate(`/${sourceKey}/pustaka?jenis=populer`)}
            badge="Top Trending"
          />

          {/* Latest Updates Section */}
          <SectionBlock
            title="Rilis Terbaru"
            items={filteredLatest.slice(0, 18)}
            sourceKey={sourceKey}
            onSeeMore={() => navigate(`/${sourceKey}/pustaka?jenis=terbaru`)}
            badge="Updated"
          />
        </>
      )}
    </div>
  );
}

/**
 * Editorial Hero Banner Carousel
 */
function HeroCarousel({ items }) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  const current = items[index] || items[0];
  if (!current) return null;

  const handleNext = () => setIndex((i) => (i + 1) % items.length);
  const handlePrev = () => setIndex((i) => (i - 1 + items.length) % items.length);

  const detailRoute = `/${current.source}/manga/${encodeURIComponent(current.id)}`;

  return (
    <section className="relative mb-12 border border-[#23232c] bg-[#121216] overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_420px]">
        {/* Left Editorial Info */}
        <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-between z-10">
          <div>
            {/* Header tags */}
            <div className="flex items-center gap-2.5 mb-3">
              <span className="flex items-center gap-1 border border-[#e11d48] bg-[#e11d48] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                <Sparkles className="w-3 h-3" />
                Unggulan
              </span>
              <span className="border border-[#2a2a35] bg-[#1a1a22] px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neutral-300">
                {current.type || 'Manga'}
              </span>
              {current.latestChapter?.num && (
                <span className="text-[10px] font-mono text-neutral-400">
                  Ch. {current.latestChapter.num}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight uppercase font-sans tracking-tight mb-3">
              {current.title}
            </h1>

            {/* Genres */}
            {current.genre && current.genre.length > 0 && (
              <p className="text-xs font-mono uppercase text-[#e11d48] tracking-wider mb-4">
                {current.genre.slice(0, 4).join('  /  ')}
              </p>
            )}

            <p className="text-xs sm:text-sm text-neutral-400 line-clamp-2 max-w-xl leading-relaxed mb-6">
              Baca bab terbaru secara gratis dengan penampil berkecepatan tinggi dan dukungan gambar tanpa batas.
            </p>
          </div>

          {/* Action buttons & carousel navigation */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#1e1e26]">
            <button
              onClick={() => navigate(detailRoute)}
              className="inline-flex items-center gap-2 border border-[#e11d48] bg-[#e11d48] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Baca Sekarang</span>
            </button>

            <Link
              to={detailRoute}
              className="inline-flex items-center border border-[#282834] bg-[#181820] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
            >
              Detail Komik
            </Link>

            {/* Carousel navigation controls */}
            {items.length > 1 && (
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={handlePrev}
                  aria-label="Komik Sebelumnya"
                  className="w-8 h-8 flex items-center justify-center border border-[#23232c] bg-[#16161c] text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs text-neutral-500 px-1">
                  {index + 1} / {items.length}
                </span>
                <button
                  onClick={handleNext}
                  aria-label="Komik Selanjutnya"
                  className="w-8 h-8 flex items-center justify-center border border-[#23232c] bg-[#16161c] text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Poster Illustration */}
        <div className="relative hidden md:block bg-[#0e0e12] overflow-hidden border-l border-[#23232c]">
          <SmartImg
            src={current.thumbnail}
            alt={current.title}
            className="w-full h-full object-cover object-top filter brightness-95 hover:brightness-100 transition-all duration-500"
            style={{ maxHeight: 380 }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#121216] via-transparent to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}

/**
 * Section block with crisp header, badge, and grid
 */
function SectionBlock({ title, items, onSeeMore, badge }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="mb-4 flex items-center justify-between border-b border-[#23232c] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-4 bg-[#e11d48]" />
          <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-white">
            {title}
          </h2>
          {badge && (
            <span className="hidden sm:inline-block border border-[#282834] bg-[#16161c] px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest text-neutral-400">
              {badge}
            </span>
          )}
        </div>

        {onSeeMore && (
          <button
            onClick={onSeeMore}
            className="text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-[#e11d48] transition-colors flex items-center gap-1"
          >
            <span>Lihat Semua</span>
            <span>→</span>
          </button>
        )}
      </div>

      <MangaGrid>
        {items.map((m, idx) => (
          <MangaCard key={`${m.id}-${idx}`} manga={m} />
        ))}
      </MangaGrid>
    </section>
  );
}
