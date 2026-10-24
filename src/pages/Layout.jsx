import { Outlet, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useApp } from '../store';
import { ShieldCheck } from 'lucide-react';

export function Layout() {
  const { sourceKey } = useApp();

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-200 flex flex-col font-sans">
      <Header />
      
      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-20 border-t border-[#202028] bg-[#0c0c10] py-10">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#1c1c24]">
            {/* Brand column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-6 h-6 bg-[#e11d48] flex items-center justify-center text-white font-black text-xs">
                  L
                </div>
                <span className="text-lg font-black text-white uppercase tracking-tight">Loui</span>
                <span className="text-lg font-black text-[#e11d48] uppercase tracking-tight">Comic</span>
              </div>
              <p className="text-xs text-neutral-400 max-w-md leading-relaxed font-mono">
                Platform pembaca manga, manhwa, dan manhua modern berdesain editorial tanpa elemen visual murahan. Mendukung integrasi multi-source dari Shinigami &amp; Komiku REST API.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono mb-3">
                Navigasi Cepat
              </h4>
              <ul className="space-y-2 text-xs font-mono text-neutral-400">
                <li>
                  <Link to="/" className="hover:text-[#e11d48] transition-colors">
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link to={`/${sourceKey}/pustaka`} className="hover:text-[#e11d48] transition-colors">
                    Pustaka Komik
                  </Link>
                </li>
                <li>
                  <Link to={`/${sourceKey}/genre`} className="hover:text-[#e11d48] transition-colors">
                    Daftar Genre
                  </Link>
                </li>
                <li>
                  <Link to="/riwayat" className="hover:text-[#e11d48] transition-colors">
                    Riwayat &amp; Bookmark
                  </Link>
                </li>
              </ul>
            </div>

            {/* API Status */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono mb-3">
                Sumber Data
              </h4>
              <ul className="space-y-2 text-xs font-mono text-neutral-400">
                <li className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Shinigami API (Louiv)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Komiku REST API</span>
                </li>
                <li className="text-[11px] text-neutral-500 pt-1">
                  Semua gambar di-proxy untuk performa &amp; anti-blokir CORS.
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-neutral-500">
            <p>
              &copy; 2026 <span className="text-neutral-300 font-bold">LouiComic</span>. Hak cipta gambar dan konten milik masing-masing kreator/penerbit asli.
            </p>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
              <span>Desain Editorial Bebas Iklan &amp; Aisop</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
