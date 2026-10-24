import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../store';
import { SmartImg, Spinner, ErrorState, timeAgo, Badge } from '../components/ui';
import {
  BookOpen,
  ArrowUpDown,
  Bookmark,
  Share2,
  CheckCircle2,
  Calendar,
  User,
  Search,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export function MangaDetail() {
  const { sourceKey, id } = useParams();
  const { sourceList, continueFor, recordRead, isBookmarked, toggleBookmark, history } = useApp();
  const navigate = useNavigate();

  // Use the source explicitly from URL parameter
  const activeSource = sourceList[sourceKey] || sourceList.shinigami;

  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortAsc, setSortAsc] = useState(false); // default: newest first (standard for scanlation)
  const [chapterFilter, setChapterFilter] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    setManga(null);
    setChapters([]);

    Promise.all([activeSource.detail(id), activeSource.chapters(id)])
      .then(([m, ch]) => {
        if (!alive) return;
        setManga(m);
        setChapters(ch || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'Gagal memuat detail komik.');
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [activeSource, id]);

  const resume = manga ? continueFor(manga.source, manga.id) : null;
  const bookmarked = manga ? isBookmarked(manga.source, manga.id) : false;

  // Chapters are sorted ascending in API (ch 1 -> ch N)
  const firstCh = chapters.length ? chapters[0] : null;
  const lastCh = chapters.length ? chapters[chapters.length - 1] : null;

  // Resolve which chapter to resume
  let resumeCh = null;
  if (resume) {
    resumeCh = chapters.find((c) => c.id === resume.chapterId);
    if (!resumeCh && resume.chapterNum !== null) {
      resumeCh = chapters.find((c) => c.num === resume.chapterNum);
    }
  }

  const openChapter = (ch, index) => {
    if (!ch) return;
    recordRead({ manga, chapter: ch, chapterIndex: index });
    navigate(
      `/${manga.source}/manga/${encodeURIComponent(id)}/baca/${encodeURIComponent(ch.id)}`
    );
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Filter chapters by search
  const filteredChapters = chapters.filter((c) => {
    if (!chapterFilter.trim()) return true;
    const q = chapterFilter.toLowerCase().trim();
    return c.name.toLowerCase().includes(q) || (c.num !== null && String(c.num).includes(q));
  });

  // Sort order
  const displayedChapters = sortAsc
    ? [...filteredChapters]
    : [...filteredChapters].reverse();

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-12">
        <Spinner label="Memuat informasi komik & daftar bab" />
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-12">
        <ErrorState
          message={error || 'Komik tidak ditemukan.'}
          onRetry={() => {
            setLoading(true);
            setError('');
            Promise.all([activeSource.detail(id), activeSource.chapters(id)])
              .then(([m, ch]) => {
                setManga(m);
                setChapters(ch || []);
                setLoading(false);
              })
              .catch((err) => {
                setError(err.message || 'Gagal memuat');
                setLoading(false);
              });
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-[11px] font-mono uppercase text-neutral-500">
        <Link to="/" className="hover:text-neutral-300">
          Beranda
        </Link>
        <ChevronRight className="w-3 h-3 text-neutral-600" />
        <Link to={`/${manga.source}/pustaka`} className="hover:text-neutral-300">
          {manga.source}
        </Link>
        <ChevronRight className="w-3 h-3 text-neutral-600" />
        <span className="text-neutral-300 truncate max-w-xs">{manga.title}</span>
      </nav>

      {/* Main Manga Info Panel */}
      <section className="border border-[#23232c] bg-[#121216] p-5 sm:p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 lg:gap-8">
          {/* Cover Poster */}
          <div className="w-48 sm:w-56 md:w-full mx-auto md:mx-0 shrink-0">
            <div className="relative aspect-[3/4] w-full border border-[#23232c] bg-[#16161c] overflow-hidden">
              <SmartImg
                src={manga.thumbnail}
                alt={manga.title}
                className="w-full h-full object-cover object-top"
              />
              <span className="absolute left-2 top-2 border border-black/40 bg-black/85 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#e11d48]">
                {manga.type}
              </span>
            </div>

            {/* Quick Actions below poster */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => toggleBookmark(manga)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 border text-xs font-bold uppercase tracking-wider transition-colors ${
                  bookmarked
                    ? 'border-[#e11d48] bg-[#e11d48] text-white'
                    : 'border-[#23232c] bg-[#181820] text-neutral-300 hover:border-neutral-500'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{bookmarked ? 'Tersimpan' : 'Simpan'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 py-2 px-3 border border-[#23232c] bg-[#181820] text-xs font-bold uppercase tracking-wider text-neutral-300 hover:border-neutral-500 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? 'Disalin!' : 'Bagikan'}</span>
              </button>
            </div>
          </div>

          {/* Details & Metadata */}
          <div className="min-w-0 flex flex-col justify-between">
            <div>
              {/* Type & Status Row */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="accentOutline">{manga.type}</Badge>
                <Badge variant={manga.status === 'Completed' ? 'dark' : 'amber'}>
                  {manga.status}
                </Badge>
                <span className="text-[10px] font-mono uppercase text-neutral-500">
                  Sumber: {manga.source}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight uppercase font-sans tracking-tight">
                {manga.title}
              </h1>

              {/* Alt Title */}
              {manga.altTitle && (
                <p className="mt-1 text-xs sm:text-sm font-mono text-neutral-400 italic">
                  {manga.altTitle}
                </p>
              )}

              {/* Meta Grid */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 border-y border-[#1e1e26] py-3 text-xs">
                <div>
                  <span className="block text-[10px] font-mono uppercase text-neutral-500">Penulis</span>
                  <span className="font-semibold text-neutral-200 truncate block">
                    {manga.author || 'Tidak diketahui'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase text-neutral-500">Seniman</span>
                  <span className="font-semibold text-neutral-200 truncate block">
                    {manga.artist || manga.author || '-'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase text-neutral-500">Jumlah Bab</span>
                  <span className="font-mono font-bold text-[#e11d48]">
                    {chapters.length} Bab
                  </span>
                </div>
              </div>

              {/* Genres list */}
              {manga.genre && manga.genre.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {manga.genre.map((g) => (
                    <Link
                      key={g}
                      to={`/${manga.source}/genre/${encodeURIComponent(g.toLowerCase())}`}
                      className="border border-[#282834] bg-[#16161c] px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-neutral-400 hover:border-[#e11d48] hover:text-[#e11d48] transition-colors"
                    >
                      {g}
                    </Link>
                  ))}
                </div>
              )}

              {/* Synopsis */}
              <div className="mt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 font-mono">
                  Sinopsis
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-4xl whitespace-pre-line">
                  {manga.description}
                </p>
              </div>
            </div>

            {/* Major CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3 pt-6 border-t border-[#1e1e26]">
              {resumeCh ? (
                <button
                  onClick={() => openChapter(resumeCh, chapters.indexOf(resumeCh))}
                  className="flex items-center gap-2 border border-[#e11d48] bg-[#e11d48] px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 active:scale-95 shadow-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Lanjutkan — {resumeCh.name}</span>
                </button>
              ) : (
                <button
                  onClick={() => openChapter(firstCh, 0)}
                  disabled={!chapters.length}
                  className="flex items-center gap-2 border border-[#e11d48] bg-[#e11d48] px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-40"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Mulai Membaca Bab 1</span>
                </button>
              )}

              {lastCh && (
                <button
                  onClick={() => openChapter(lastCh, chapters.length - 1)}
                  disabled={!chapters.length}
                  className="border border-[#282834] bg-[#16161c] px-5 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors disabled:opacity-40"
                >
                  Bab Terakhir ({lastCh.num ? `Ch. ${lastCh.num}` : 'Terbaru'})
                </button>
              )}

              {resumeCh && firstCh && (
                <button
                  onClick={() => openChapter(firstCh, 0)}
                  className="border border-[#23232c] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
                >
                  Ulang Dari Awal
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Chapters Section */}
      <section className="border border-[#23232c] bg-[#121216] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23232c] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-[#e11d48]" />
            <h2 className="text-base font-extrabold uppercase tracking-wide text-white">
              Daftar Bab
            </h2>
            <span className="font-mono text-xs text-neutral-500">
              ({displayedChapters.length} dari {chapters.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick chapter search input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nomor bab…"
                value={chapterFilter}
                onChange={(e) => setChapterFilter(e.target.value)}
                className="h-8 w-36 sm:w-44 border border-[#23232c] bg-[#16161c] pl-8 pr-2 text-xs text-neutral-200 placeholder:text-neutral-500 focus:border-[#e11d48] focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Sort Direction Toggle */}
            <button
              onClick={() => setSortAsc((v) => !v)}
              className="flex items-center gap-1.5 border border-[#23232c] bg-[#16161c] px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 hover:border-[#e11d48] hover:text-white transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortAsc ? 'Terlama → Terbaru' : 'Terbaru → Terlama'}</span>
            </button>
          </div>
        </div>

        {/* Chapter List */}
        {displayedChapters.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-neutral-500">
            {chapters.length === 0 ? 'Belum ada bab yang dirilis.' : 'Tidak ada bab yang cocok dengan pencarian.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[680px] overflow-y-auto pr-1">
            {displayedChapters.map((ch) => {
              const originalIndex = chapters.indexOf(ch);
              const isCurrentResume = resumeCh?.id === ch.id;

              return (
                <button
                  key={ch.id}
                  onClick={() => openChapter(ch, originalIndex)}
                  className={`flex items-center justify-between p-3 border text-left transition-all group ${
                    isCurrentResume
                      ? 'border-[#e11d48] bg-[#e11d48]/10'
                      : 'border-[#202028] bg-[#141419] hover:border-[#383846] hover:bg-[#181820]'
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    {isCurrentResume && (
                      <span className="w-2 h-2 rounded-full bg-[#e11d48] shrink-0" />
                    )}
                    <div>
                      <span
                        className={`text-xs font-bold block truncate ${
                          isCurrentResume
                            ? 'text-[#e11d48]'
                            : 'text-neutral-200 group-hover:text-white'
                        }`}
                      >
                        {ch.name}
                      </span>
                      {ch.releaseAt && (
                        <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{timeAgo(ch.releaseAt)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-neutral-500 group-hover:text-[#e11d48] shrink-0 ml-2">
                    Baca →
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
