import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../store';
import { Spinner, ErrorState } from '../components/ui';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Maximize2,
  Minimize2,
  RefreshCw,
  Menu,
  X
} from 'lucide-react';

export function Reader() {
  const { sourceKey, id, chapterId } = useParams();
  const { sourceList, recordRead } = useApp();
  const navigate = useNavigate();

  const activeSource = sourceList[sourceKey] || sourceList.shinigami;

  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readerWidth, setReaderWidth] = useState('max-w-[850px]'); // options: 700px, 850px, full
  const [showChapterMenu, setShowChapterMenu] = useState(false);
  const [currentVisiblePage, setCurrentVisiblePage] = useState(1);

  const containerRef = useRef(null);

  // Load manga info, chapters, and chapter pages
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'instant' });

    Promise.all([
      activeSource.detail(id),
      activeSource.chapters(id),
      activeSource.chapterPages(id, chapterId),
    ])
      .then(([m, ch, p]) => {
        if (!alive) return;
        setManga(m);
        setChapters(ch || []);
        setPages(p || []);
        setLoading(false);

        // Record history
        const currentCh = (ch || []).find((c) => c.id === chapterId);
        if (currentCh) {
          recordRead({
            manga: m,
            chapter: currentCh,
            chapterIndex: (ch || []).indexOf(currentCh),
          });
        }
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'Gagal memuat halaman komik.');
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [activeSource, id, chapterId]);

  // Find index of current chapter
  const currentChIndex = chapters.findIndex((c) => c.id === chapterId);
  const currentCh = chapters[currentChIndex];
  const prevCh = currentChIndex > 0 ? chapters[currentChIndex - 1] : null;
  const nextCh = currentChIndex >= 0 && currentChIndex < chapters.length - 1 ? chapters[currentChIndex + 1] : null;

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'ArrowLeft' && prevCh) {
        navigate(`/${sourceKey}/manga/${encodeURIComponent(id)}/baca/${encodeURIComponent(prevCh.id)}`);
      } else if (e.key === 'ArrowRight' && nextCh) {
        navigate(`/${sourceKey}/manga/${encodeURIComponent(id)}/baca/${encodeURIComponent(nextCh.id)}`);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevCh, nextCh, sourceKey, id, navigate]);

  // Track scroll position to update visible page counter
  useEffect(() => {
    function handleScroll() {
      const pageElements = document.querySelectorAll('.reader-page-item');
      if (!pageElements.length) return;
      const scrollY = window.scrollY + window.innerHeight / 3;

      for (let i = 0; i < pageElements.length; i++) {
        const el = pageElements[i];
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (scrollY >= top && scrollY <= bottom) {
          setCurrentVisiblePage(i + 1);
          break;
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pages]);

  const toggleWidth = () => {
    if (readerWidth === 'max-w-[720px]') setReaderWidth('max-w-[900px]');
    else if (readerWidth === 'max-w-[900px]') setReaderWidth('max-w-full');
    else setReaderWidth('max-w-[720px]');
  };

  const goToChapter = (targetId) => {
    setShowChapterMenu(false);
    navigate(`/${sourceKey}/manga/${encodeURIComponent(id)}/baca/${encodeURIComponent(targetId)}`);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-200 pb-28">
      {/* Top Floating Mini Header */}
      <div className="sticky top-0 z-40 border-b border-[#202028] bg-[#0a0a0c]/90 backdrop-blur px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/${sourceKey}/manga/${encodeURIComponent(id)}`}
            className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline font-mono uppercase">Detail</span>
          </Link>
          <div className="h-4 w-[1px] bg-[#23232c]" />
          <div className="min-w-0">
            <h1 className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-md">
              {manga?.title || 'Memuat...'}
            </h1>
            <span className="text-[10px] font-mono text-[#e11d48] truncate block">
              {currentCh?.name || 'Chapter'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pages.length > 0 && (
            <span className="text-[11px] font-mono text-neutral-400 px-2 py-0.5 border border-[#23232c] bg-[#121216]">
              {currentVisiblePage} / {pages.length}
            </span>
          )}

          <button
            onClick={toggleWidth}
            title="Ubah lebar baca"
            className="p-1.5 border border-[#23232c] bg-[#121216] text-neutral-400 hover:text-white"
          >
            {readerWidth === 'max-w-full' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto px-0 sm:px-4 py-4" ref={containerRef}>
        {loading && (
          <div className="py-24">
            <Spinner label="Memuat gambar chapter" />
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto px-4 py-12">
            <ErrorState
              message={error}
              onRetry={() => {
                setLoading(true);
                setError('');
                activeSource.chapterPages(id, chapterId)
                  .then((p) => {
                    setPages(p || []);
                    setLoading(false);
                  })
                  .catch((err) => {
                    setError(err.message || 'Gagal memuat');
                    setLoading(false);
                  });
              }}
            />
          </div>
        )}

        {!loading && !error && pages.length === 0 && (
          <div className="text-center py-20 px-4 text-xs font-mono text-neutral-400">
            Tidak ada gambar yang ditemukan untuk bab ini.
          </div>
        )}

        {/* Continuous Webtoon Reader */}
        {!loading && !error && pages.length > 0 && (
          <div className={`mx-auto ${readerWidth} flex flex-col items-center bg-[#000000]`}>
            {pages.map((p, idx) => (
              <ReaderImageItem
                key={`${p.id}-${idx}`}
                page={p}
                index={idx}
                totalPages={pages.length}
              />
            ))}
          </div>
        )}

        {/* Chapter Completion Card */}
        {!loading && !error && pages.length > 0 && (
          <div className="max-w-lg mx-auto mt-12 mb-8 p-6 border border-[#23232c] bg-[#121216] text-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">
              Anda telah menyelesaikan bab ini
            </h3>
            <p className="text-xs font-mono text-[#e11d48] mb-5">
              {currentCh?.name}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {nextCh ? (
                <button
                  onClick={() => goToChapter(nextCh.id)}
                  className="flex items-center gap-2 border border-[#e11d48] bg-[#e11d48] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 transition-opacity"
                >
                  <span>Bab Selanjutnya ({nextCh.name})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-xs font-mono text-neutral-500 border border-[#23232c] px-4 py-2">
                  Ini adalah bab terbaru!
                </span>
              )}

              <Link
                to={`/${sourceKey}/manga/${encodeURIComponent(id)}`}
                className="border border-[#282834] bg-[#181820] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:text-white"
              >
                Kembali ke Detail
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-[#23232c] bg-[#0a0a0c]/95 backdrop-blur-md py-2.5 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Previous Chapter */}
          <button
            onClick={() => prevCh && goToChapter(prevCh.id)}
            disabled={!prevCh}
            className="flex items-center gap-1 border border-[#282834] bg-[#141418] hover:bg-[#1a1a22] disabled:opacity-30 disabled:pointer-events-none px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-300"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          {/* Quick Chapter Selector Trigger */}
          <div className="relative flex-1 max-w-xs">
            <button
              onClick={() => setShowChapterMenu(!showChapterMenu)}
              className="w-full flex items-center justify-between border border-[#282834] bg-[#141418] hover:border-[#e11d48] px-3 py-2 text-xs font-mono text-white truncate"
            >
              <span className="truncate">{currentCh?.name || 'Pilih Bab'}</span>
              <Menu className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-1.5" />
            </button>

            {/* Chapter Popup Menu */}
            {showChapterMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 max-h-72 overflow-y-auto border border-[#282834] bg-[#0d0d12] shadow-2xl p-1 z-50">
                <div className="sticky top-0 bg-[#0d0d12] border-b border-[#23232c] p-2 flex items-center justify-between text-[11px] font-mono uppercase text-neutral-400">
                  <span>Daftar Bab ({chapters.length})</span>
                  <button onClick={() => setShowChapterMenu(false)} className="text-neutral-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="py-1">
                  {chapters.map((ch) => {
                    const isSelected = ch.id === chapterId;
                    return (
                      <button
                        key={ch.id}
                        onClick={() => goToChapter(ch.id)}
                        className={`w-full text-left px-3 py-2 text-xs font-mono truncate transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#e11d48] text-white font-bold'
                            : 'text-neutral-300 hover:bg-[#181820]'
                        }`}
                      >
                        <span className="truncate">{ch.name}</span>
                        {isSelected && <span className="text-[10px] uppercase ml-2 shrink-0">Aktif</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Next Chapter */}
          <button
            onClick={() => nextCh && goToChapter(nextCh.id)}
            disabled={!nextCh}
            className="flex items-center gap-1 border border-[#e11d48] bg-[#e11d48] hover:opacity-90 disabled:border-[#282834] disabled:bg-[#141418] disabled:opacity-30 disabled:pointer-events-none px-3 py-2 text-xs font-bold uppercase tracking-wider text-white"
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Single Image component with multi-level retry and full width support
 */
function ReaderImageItem({ page, index }) {
  const [src, setSrc] = useState(page.url);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setSrc(page.url);
    setError(false);
    setAttempt(0);
  }, [page.url]);

  const handleImgError = () => {
    if (attempt === 0 && page.rawUrl && page.rawUrl !== src) {
      setSrc(page.rawUrl);
      setAttempt(1);
      return;
    }
    if (attempt <= 1 && page.fallback && page.fallback !== src) {
      setSrc(page.fallback);
      setAttempt(2);
      return;
    }
    setError(true);
  };

  const handleRetry = () => {
    setError(false);
    setAttempt(0);
    setSrc(`${page.url}${page.url.includes('?') ? '&' : '?'}t=${Date.now()}`);
  };

  return (
    <div className="reader-page-item w-full relative bg-[#0a0a0c] select-none">
      {error ? (
        <div className="w-full aspect-[2/3] max-h-[500px] flex flex-col items-center justify-center p-6 border border-[#23232c] text-center bg-[#121216]">
          <p className="text-xs text-neutral-400 mb-3 font-mono">
            Gagal memuat gambar halaman #{index + 1}
          </p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 border border-[#e11d48] bg-[#e11d48] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Muat Ulang Halaman</span>
          </button>
        </div>
      ) : (
        <img
          src={src}
          alt={`Halaman ${index + 1}`}
          loading={index < 4 ? 'eager' : 'lazy'}
          decoding="async"
          className="w-full h-auto block select-none pointer-events-none"
          onError={handleImgError}
        />
      )}
    </div>
  );
}
