import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';

export function Layout() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-neutral-200">
      <Header />
      <main>
        <Outlet />
      </main>
      <footer className="mt-16 border-t border-[var(--border)] py-8">
        <div className="mx-auto max-w-[1400px] px-4 text-xs text-neutral-600">
          <p>
            <span className="font-bold text-neutral-400">LouiComic</span> — pembaca
            manga / manhwa / manhua. Data dari Shinigami &amp; Komiku REST API.
          </p>
        </div>
      </footer>
    </div>
  );
}
