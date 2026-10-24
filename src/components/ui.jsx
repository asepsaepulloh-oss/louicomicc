import { useState, useEffect } from 'react';
import { komiku, shinigami } from '../api';
import { AlertTriangle, RefreshCw, ImageOff } from 'lucide-react';

/**
 * SmartImg handles proxied and direct images with multi-tier fallback:
 * 1. Try initial src (e.g. proxy)
 * 2. If fails, try raw unproxied URL
 * 3. If provided, try custom fallback
 * 4. Display clean placeholder on total failure
 */
export function SmartImg({
  src,
  fallback,
  alt = '',
  className = '',
  aspectRatio = '3/4',
  ...rest
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setAttempt(0);
  }, [src]);

  function handleError() {
    if (attempt === 0) {
      // Attempt 1: Try unproxied raw URL
      const rawKomi = komiku.rawUrlOf(currentSrc);
      const rawShig = shinigami.rawUrlOf(currentSrc);
      const raw = rawKomi || rawShig;

      if (raw && raw !== currentSrc) {
        setCurrentSrc(raw);
        setAttempt(1);
        return;
      }
    }

    if (attempt <= 1 && fallback && fallback !== currentSrc) {
      setCurrentSrc(fallback);
      setAttempt(2);
      return;
    }

    setHasError(true);
  }

  if (hasError || !currentSrc) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#15151b] border border-[#23232c] text-neutral-500 p-2 text-center select-none ${className}`}
        style={{ aspectRatio }}
      >
        <ImageOff className="w-6 h-6 stroke-[1.5] text-neutral-600 mb-1" />
        <span className="text-[10px] tracking-wider uppercase text-neutral-500 font-mono">No Image</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={handleError}
      {...rest}
    />
  );
}

export function Spinner({ label = 'Memuat data' }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-20 text-neutral-400"
      role="status"
    >
      <div className="relative flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#23232c] border-t-[#e11d48] animate-spin" />
      </div>
      <span className="text-xs font-medium tracking-wider uppercase font-mono text-neutral-400">
        {label}…
      </span>
    </div>
  );
}

export function ErrorState({ message = 'Terjadi kesalahan sistem.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center border border-[#23232c] bg-[#121216] my-6">
      <div className="w-10 h-10 rounded-full bg-[#e11d48]/10 border border-[#e11d48]/30 flex items-center justify-center text-[#e11d48]">
        <AlertTriangle className="w-5 h-5 stroke-[2]" />
      </div>
      <div className="max-w-md">
        <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider mb-1">
          Gagal Memuat
        </h3>
        <p className="text-xs text-neutral-400 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 border border-[#e11d48] bg-[#e11d48] text-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-90 active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Coba Lagi</span>
        </button>
      )}
    </div>
  );
}

export function Badge({ children, variant = 'default', className = '' }) {
  const styles = {
    default: 'bg-[#1a1a22] text-neutral-300 border-[#2a2a35]',
    accent: 'bg-[#e11d48] text-white border-[#e11d48]',
    accentOutline: 'border-[#e11d48]/60 text-[#f43f5e] bg-[#e11d48]/10',
    amber: 'bg-[#f59e0b] text-neutral-950 font-bold border-[#f59e0b]',
    dark: 'bg-black/85 text-neutral-200 border-white/10',
  };

  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[variant] || styles.default} ${className}`}
    >
      {children}
    </span>
  );
}

export function timeAgo(input) {
  if (!input) return '';
  const d = typeof input === 'number' ? new Date(input) : new Date(input);
  if (isNaN(d.getTime())) return '';
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'Baru saja';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}h lalu`;
  const mo = Math.floor(days / 30);
  if (mo < 12) return `${mo}bln lalu`;
  return `${Math.floor(mo / 12)}th lalu`;
}
