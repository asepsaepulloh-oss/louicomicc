import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../store';

const NAV = [
  { to: '/', label: 'Beranda', end: true },
  { to: '/pustaka', label: 'Pustaka' },
  { to: '/genre', label: 'Genre' },
  { to: '/riwayat', label: 'Riwayat' },
];

export function Header() {
  const { source, sourceKey, setSourceKey, sourceList } = useApp();
  const [q, setQ] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  function submitSearch(e) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    navigate(`/${sourceKey}/search?q=${encodeURIComponent(term)}`);
    setQ('');
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4">
        {/* Brand */}
        <Link to="/" className="flex shrink-0 items-baseline gap-1 leading-none">
          <span className="text-lg font-black tracking-tight text-neutral-100">Loui</span>
          <span className="text-lg font-black tracking-tight text-[var(--accent)]">Comic</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[var(--accent)]'
                    : 'text-neutral-400 hover:text-neutral-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Search */}
        <form onSubmit={submitSearch} className="hidden items-center sm:flex">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Cari komik…"
            aria-label="Pencarian"
            className="h-8 w-40 border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-[var(--accent)] focus:outline-none lg:w-56"
          />
          <button
            type="submit"
            aria-label="Cari"
            className="flex h-8 w-9 items-center justify-center border border-l-0 border-[var(--border)] bg-[var(--accent)] text-sm font-bold text-[var(--bg)]"
          >
            ⌕
          </button>
        </form>

        {/* Source toggle */}
        <div className="hidden items-center border border-[var(--border)] md:flex">
          {Object.values(sourceList).map((s) => (
            <button
              key={s.key}
              onClick={() => setSourceKey(s.key)}
              aria-pressed={sourceKey === s.key}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                sourceKey === s.key
                  ? 'bg-[var(--accent)] text-[var(--bg)]'
                  : 'text-neutral-400 hover:text-neutral-100'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
          className="flex h-8 w-8 items-center justify-center border border-[var(--border)] text-neutral-300 md:hidden"
        >
          {mobileOpen ? '×' : '☰'}
        </button>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--bg)] px-4 py-4 md:hidden">
          <form onSubmit={submitSearch} className="mb-4 flex">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              placeholder="Cari komik…"
              aria-label="Pencarian"
              className="h-9 flex-1 border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-neutral-200 focus:border-[var(--accent)] focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Cari"
              className="h-9 w-10 border border-l-0 border-[var(--border)] bg-[var(--accent)] font-bold text-[var(--bg)]"
            >
              ⌕
            </button>
          </form>
          <nav className="grid grid-cols-2 gap-2">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="border border-[var(--border)] px-3 py-2 text-center text-sm font-medium text-neutral-300"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Sumber
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(sourceList).map((s) => (
                <button
                  key={s.key}
                  onClick={() => {
                    setSourceKey(s.key);
                    setMobileOpen(false);
                  }}
                  aria-pressed={sourceKey === s.key}
                  className={`border px-3 py-2 text-sm font-semibold transition-colors ${
                    sourceKey === s.key
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]'
                      : 'border-[var(--border)] text-neutral-400'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
