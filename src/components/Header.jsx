import { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../store';
import { Search, BookOpen, Layers, History, Menu, X, Flame } from 'lucide-react';

export function Header() {
  const { source, sourceKey, setSourceKey, sourceList, history } = useApp();
  const [q, setQ] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const NAV = [
    { to: '/', label: 'Beranda', icon: Flame, end: true },
    { to: `/${sourceKey}/pustaka`, label: 'Pustaka', icon: BookOpen },
    { to: `/${sourceKey}/genre`, label: 'Genre', icon: Layers },
    { to: '/riwayat', label: 'Riwayat', icon: History, count: history?.entries?.length || 0 },
  ];

  function submitSearch(e) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    navigate(`/${sourceKey}/search?q=${encodeURIComponent(term)}`);
    setQ('');
    setMobileOpen(false);
  }

  const handleSourceChange = (key) => {
    setSourceKey(key);
    // If we're on a source-prefixed page like /:source/pustaka or /:source/genre, navigate cleanly
    if (location.pathname.includes('/pustaka')) {
      navigate(`/${key}/pustaka`);
    } else if (location.pathname.includes('/genre')) {
      navigate(`/${key}/genre`);
    } else if (location.pathname.includes('/search')) {
      const sp = new URLSearchParams(location.search);
      const query = sp.get('q');
      navigate(`/${key}/search${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    } else if (location.pathname.startsWith('/shinigami/manga') || location.pathname.startsWith('/komiku/manga')) {
      // Manga IDs may differ across sources, navigate to home on switch
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#23232c] bg-[#0a0a0c]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Link to="/" className="flex shrink-0 items-center gap-1.5 group select-none">
          <div className="w-6 h-6 bg-[#e11d48] flex items-center justify-center text-white font-black text-xs tracking-tighter">
            L
          </div>
          <div className="flex items-baseline tracking-tight">
            <span className="text-lg font-black text-white uppercase font-sans tracking-tight">Loui</span>
            <span className="text-lg font-black text-[#e11d48] uppercase font-sans tracking-tight">Comic</span>
          </div>
          <span className="hidden lg:inline-block ml-1.5 px-1.5 py-0.5 border border-[#333340] text-[9px] font-mono uppercase tracking-wider text-neutral-400">
            PRO
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors border ${
                    isActive
                      ? 'border-[#e11d48] text-white bg-[#e11d48]/10'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-[#262632]'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.count > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[9px] font-mono bg-[#23232c] text-neutral-300">
                    {item.count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Instant Search Bar */}
        <form onSubmit={submitSearch} className="hidden sm:flex items-center">
          <div className="relative flex items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              placeholder={`Cari di ${source.name}…`}
              aria-label="Pencarian komik"
              className="h-8 w-44 lg:w-60 border border-[#23232c] bg-[#121216] pl-8 pr-3 text-xs text-neutral-200 placeholder:text-neutral-500 focus:border-[#e11d48] focus:bg-[#15151b] focus:outline-none transition-all"
            />
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 pointer-events-none" />
          </div>
          <button
            type="submit"
            aria-label="Cari"
            className="flex h-8 items-center justify-center border border-l-0 border-[#23232c] bg-[#1e1e26] hover:bg-[#e11d48] hover:text-white px-3 text-xs font-bold text-neutral-300 uppercase tracking-wider transition-colors"
          >
            Cari
          </button>
        </form>

        {/* Source Toggle Selector */}
        <div className="hidden sm:flex items-center border border-[#23232c] p-0.5 bg-[#121216]">
          <span className="px-2 text-[10px] uppercase font-mono tracking-wider text-neutral-500 border-r border-[#23232c] mr-0.5">
            Sumber:
          </span>
          {Object.values(sourceList).map((s) => {
            const isSelected = sourceKey === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => handleSourceChange(s.key)}
                aria-pressed={isSelected}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  isSelected
                    ? 'bg-[#e11d48] text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Buka Menu"
          className="flex h-8 w-8 items-center justify-center border border-[#23232c] text-neutral-300 hover:text-white md:hidden bg-[#121216]"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-[#23232c] bg-[#0d0d10] px-4 py-4 md:hidden animate-in slide-in-from-top-2 duration-150">
          <form onSubmit={submitSearch} className="mb-4 flex">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              placeholder={`Cari di ${source.name}…`}
              aria-label="Pencarian"
              className="h-9 flex-1 border border-[#23232c] bg-[#141418] px-3 text-xs text-neutral-200 placeholder:text-neutral-500 focus:border-[#e11d48] focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Cari"
              className="h-9 border border-l-0 border-[#23232c] bg-[#e11d48] text-white px-4 text-xs font-bold uppercase tracking-wider"
            >
              Cari
            </button>
          </form>

          <nav className="grid grid-cols-2 gap-2 mb-4">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 border border-[#23232c] bg-[#121216] px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:border-[#e11d48] hover:text-white"
                >
                  <Icon className="w-3.5 h-3.5 text-[#e11d48]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-[#1c1c24]">
            <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              Pilih Sumber API:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(sourceList).map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    handleSourceChange(s.key);
                    setMobileOpen(false);
                  }}
                  className={`border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    sourceKey === s.key
                      ? 'border-[#e11d48] bg-[#e11d48] text-white'
                      : 'border-[#23232c] bg-[#121216] text-neutral-400'
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
