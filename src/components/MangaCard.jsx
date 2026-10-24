import { Link } from 'react-router-dom';
import { useApp } from '../store';
import { SmartImg } from './ui';
import { Bookmark } from 'lucide-react';

/**
 * Modern Editorial Vertical Poster Card
 * Sharp 1px borders, subtle transitions, clean typography, no generic rounded pill aesthetic.
 */
export function MangaCard({ manga, latest }) {
  const { source, isBookmarked, toggleBookmark } = useApp();
  const thumb = source.thumb?.(manga.thumbnail) || manga.thumbnail;
  const bookmarked = isBookmarked(manga.source, manga.id);

  const displayLatest =
    latest ||
    (manga.latestChapter?.num !== undefined && manga.latestChapter?.num !== null
      ? `Ch. ${manga.latestChapter.num}`
      : manga.latestChapter?.title || null);

  const route = `/${manga.source}/manga/${encodeURIComponent(manga.id)}`;

  return (
    <div className="group relative flex flex-col bg-[#121216] border border-[#23232c] hover:border-[#383846] transition-all duration-200">
      <Link
        to={route}
        className="block select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#e11d48]"
        aria-label={manga.title}
      >
        {/* Poster Wrapper with 3:4 Aspect Ratio */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#181820]">
          <SmartImg
            src={thumb}
            alt={manga.title}
            className="h-full w-full object-cover object-top transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />

          {/* Dark subtle gradient overlay at bottom for poster readability */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

          {/* Type Badge - Top Left */}
          {manga.type && (
            <span className="absolute left-1.5 top-1.5 border border-black/40 bg-black/85 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-[#e11d48]">
              {manga.type}
            </span>
          )}

          {/* Latest Chapter - Top Right */}
          {displayLatest && (
            <span className="absolute right-1.5 top-1.5 border border-white/10 bg-[#0a0a0c]/90 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-neutral-200">
              {displayLatest}
            </span>
          )}

          {/* Source indicator if mixed */}
          <span className="absolute left-1.5 bottom-1.5 text-[9px] font-mono uppercase text-neutral-400 opacity-90 drop-shadow">
            {manga.source}
          </span>
        </div>
      </Link>

      {/* Bookmark quick button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleBookmark(manga);
        }}
        title={bookmarked ? 'Hapus dari Tersimpan' : 'Simpan ke Tersimpan'}
        aria-label="Simpan komik"
        className={`absolute top-2 right-2 z-10 p-1.5 border transition-all ${
          bookmarked
            ? 'bg-[#e11d48] border-[#e11d48] text-white opacity-100'
            : 'bg-black/75 border-white/20 text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-white hover:border-white/50'
        }`}
      >
        <Bookmark className="w-3.5 h-3.5 fill-current" />
      </button>

      {/* Text Info Container */}
      <div className="p-2.5 flex flex-col flex-1 justify-between bg-[#121216]">
        <div>
          <Link to={route}>
            <h3 className="line-clamp-2 text-xs sm:text-[13px] font-bold leading-snug text-neutral-200 transition-colors group-hover:text-[#e11d48]">
              {manga.title}
            </h3>
          </Link>
          {manga.genre && manga.genre.length > 0 && (
            <p className="mt-1 line-clamp-1 text-[10px] font-mono text-neutral-500 uppercase">
              {manga.genre.slice(0, 2).join(' · ')}
            </p>
          )}
        </div>

        {manga.updateTime && (
          <span className="mt-2 text-[9px] font-mono text-neutral-500">
            {manga.updateTime}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Tight, proportional responsive manga card grid
 */
export function MangaGrid({ children }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4">
      {children}
    </div>
  );
}
