import { useState } from 'react';
import { komiku } from '../api';

/**
 * Image that renders through the source's proxy. If the proxy 404s (or the
 * raw URL is unreachable) it falls back to the direct URL for Komiku items.
 */
export function SmartImg({ src, fallback, alt = '', className = '', ...rest }) {
  const [current, setCurrent] = useState({ src });

  function handleErr(e) {
    // If we came from the proxy and a fallback raw URL exists, try it directly.
    const raw = komiku.rawUrlOf(current.src);
    if (raw && current.src !== raw) {
      setCurrent({ src: raw });
      return;
    }
    if (fallback && fallback !== current.src) {
      setCurrent({ src: fallback });
      return;
    }
    // Nothing left to try.
    e.target.style.visibility = 'hidden';
  }

  return (
    <img
      src={current.src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={handleErr}
      {...rest}
    />
  );
}

export function Spinner({ label = 'Memuat' }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-24 text-neutral-500"
      role="status"
    >
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-[var(--accent)]" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function ErrorState({ message = 'Terjadi kesalahan.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="max-w-sm text-sm text-neutral-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="border border-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--bg)]"
        >
          Coba Lagi
        </button>
      )}
    </div>
  );
}

/** Format an ISO/epoch time into a short relative string. */
export function timeAgo(input) {
  if (!input) return '';
  const d = new Date(input);
  if (isNaN(d)) return '';
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'baru saja';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} hari lalu`;
  const mo = Math.floor(days / 30);
  if (mo < 12) return `${mo} bln lalu`;
  return `${Math.floor(mo / 12)} thn lalu`;
}
