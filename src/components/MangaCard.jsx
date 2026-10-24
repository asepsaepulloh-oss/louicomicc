import { Link } from 'react-router-dom';
import { useApp } from '../store';
import { SmartImg } from './ui';

/**
 * Vertical poster card. `manga` is a normalized item; reads the active source
 * from context so the thumbnail routes through that source's proxy.
 */
export function MangaCard({ manga, latest }) {
  const { source } = useApp();
  const thumb = source.thumb?.(manga.thumbnail) || manga.thumbnail;

  return (
    <Link
      to={`/${manga.source}/manga/${encodeURIComponent(manga.id)}`}
      className="group block select-none focus-visible:outline-none"
      aria-label={manga.title}
    >
      <div className="relative overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
        <div className="aspect-[3/4] w-full overflow-hidden">
          <SmartImg
            src={thumb}
            alt={manga.title}
            className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        </div>

        {/* Latest-chapter badge */}
        {(latest || manga.latestChapter?.num !== undefined) && (
          <span className="absolute right-1.5 top-1.5 bg-black/85 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-neutral-100">
            {latest || `Ch. ${manga.latestChapter?.num}`}
          </span>
        )}

        {/* Type tag */}
        <span className="absolute left-1.5 top-1.5 bg-[var(--bg)]/85 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
          {manga.type}
        </span>
      </div>

      <div className="pt-2.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-tight text-neutral-200 transition-colors group-hover:text-[var(--accent)]">
          {manga.title}
        </h3>
        {manga.genre?.length > 0 && (
          <p className="mt-1 line-clamp-1 text-[11px] text-neutral-500">
            {manga.genre.slice(0, 3).join(' · ')}
          </p>
        )}
      </div>
    </Link>
  );
}

/** A row of cards — responsive grid used across the site. */
export function MangaGrid({ children }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {children}
    </div>
  );
}
