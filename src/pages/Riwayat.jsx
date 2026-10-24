import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store';
import { SmartImg, timeAgo } from '../components/ui';
import { History, Bookmark, Trash2, Play, BookOpen, Compass } from 'lucide-react';

export function Riwayat() {
  const { history, clearHistory, removeHistoryItem, bookmarks, toggleBookmark } = useApp();
  const [tab, setTab] = useState('history'); // 'history' | 'bookmarks'
  const [confirmClear, setConfirmClear] = useState(false);

  const entries = history?.entries || [];

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">
      {/* Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23232c] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#e11d48]" />
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-sans">
              Riwayat & Koleksi
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            Kelola bab yang pernah Anda baca dan komik favorit tersimpan di perangkat ini
          </p>
        </div>

        {tab === 'history' && entries.length > 0 && (
          <div>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400">Yakin hapus?</span>
                <button
                  onClick={() => {
                    clearHistory();
                    setConfirmClear(false);
                  }}
                  className="border border-[#e11d48] bg-[#e11d48] px-3 py-1 text-xs font-bold uppercase text-white"
                >
                  Ya, Hapus
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="border border-[#282834] bg-[#16161c] px-3 py-1 text-xs uppercase text-neutral-400"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1.5 border border-[#282834] bg-[#16161c] hover:border-[#e11d48] hover:text-[#e11d48] px-3.5 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-[#23232c] pb-2">
        <button
          onClick={() => setTab('history')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
            tab === 'history'
              ? 'border-[#e11d48] bg-[#e11d48] text-white'
              : 'border-[#23232c] bg-[#121216] text-neutral-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Riwayat Bacaan ({entries.length})</span>
        </button>

        <button
          onClick={() => setTab('bookmarks')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
            tab === 'bookmarks'
              ? 'border-[#e11d48] bg-[#e11d48] text-white'
              : 'border-[#23232c] bg-[#121216] text-neutral-400 hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Komik Tersimpan ({bookmarks.length})</span>
        </button>
      </div>

      {/* Tab: Reading History */}
      {tab === 'history' && (
        <>
          {entries.length === 0 ? (
            <div className="py-24 text-center border border-[#23232c] bg-[#121216] p-6">
              <Compass className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-1">
                Belum Ada Riwayat
              </h3>
              <p className="text-xs font-mono text-neutral-400 mb-6 max-w-sm mx-auto">
                Anda belum membaca komik apa pun. Jelajahi pustaka untuk memulai membaca chapter pertama Anda.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 border border-[#e11d48] bg-[#e11d48] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90"
              >
                <BookOpen className="w-4 h-4" />
                <span>Mulai Eksplorasi</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entries.map((item) => {
                const readerRoute = `/${item.source}/manga/${encodeURIComponent(item.id)}/baca/${encodeURIComponent(item.chapterId)}`;
                const detailRoute = `/${item.source}/manga/${encodeURIComponent(item.id)}`;

                return (
                  <div
                    key={`${item.source}-${item.id}`}
                    className="flex border border-[#23232c] bg-[#121216] p-3.5 gap-4 group hover:border-[#383846] transition-colors"
                  >
                    {/* Thumbnail */}
                    <Link
                      to={readerRoute}
                      className="w-20 aspect-[3/4] shrink-0 bg-[#16161c] border border-[#23232c] overflow-hidden"
                    >
                      <SmartImg
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                      />
                    </Link>

                    {/* Metadata & Actions */}
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[9px] font-mono uppercase text-neutral-500">
                            {item.source} · {item.type}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {timeAgo(item.updatedAt)}
                          </span>
                        </div>

                        <Link to={detailRoute}>
                          <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#e11d48] transition-colors">
                            {item.title}
                          </h3>
                        </Link>

                        <p className="text-xs font-mono font-semibold text-[#e11d48] mt-1 truncate">
                          Terakhir: {item.chapterTitle}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#1c1c24]">
                        <Link
                          to={readerRoute}
                          className="inline-flex items-center gap-1.5 border border-[#e11d48] bg-[#e11d48] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white hover:opacity-90"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Lanjut Baca</span>
                        </Link>

                        <button
                          onClick={() => removeHistoryItem(item.source, item.id)}
                          title="Hapus dari riwayat"
                          className="p-1.5 text-neutral-500 hover:text-neutral-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab: Bookmarks */}
      {tab === 'bookmarks' && (
        <>
          {bookmarks.length === 0 ? (
            <div className="py-24 text-center border border-[#23232c] bg-[#121216] p-6">
              <Bookmark className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-1">
                Belum Ada Komik Tersimpan
              </h3>
              <p className="text-xs font-mono text-neutral-400 mb-6 max-w-sm mx-auto">
                Klik ikon bookmark pada komik mana pun untuk menyimpannya ke daftar bacaan pribadi Anda.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 border border-[#e11d48] bg-[#e11d48] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90"
              >
                <BookOpen className="w-4 h-4" />
                <span>Eksplorasi Komik</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {bookmarks.map((m) => {
                const detailRoute = `/${m.source}/manga/${encodeURIComponent(m.id)}`;
                return (
                  <div
                    key={`${m.source}-${m.id}`}
                    className="border border-[#23232c] bg-[#121216] flex flex-col justify-between p-3 group hover:border-[#383846] transition-colors"
                  >
                    <div className="flex gap-3">
                      <Link to={detailRoute} className="w-16 aspect-[3/4] shrink-0 bg-[#16161c] overflow-hidden">
                        <SmartImg
                          src={m.thumbnail}
                          alt={m.title}
                          className="w-full h-full object-cover object-top"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-mono uppercase text-[#e11d48] block mb-0.5">
                          {m.type} · {m.source}
                        </span>
                        <Link to={detailRoute}>
                          <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-[#e11d48] transition-colors">
                            {m.title}
                          </h4>
                        </Link>
                        <span className="text-[10px] font-mono text-neutral-500 mt-2 block">
                          Tersimpan {timeAgo(m.addedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#1c1c24] flex items-center justify-between">
                      <Link
                        to={detailRoute}
                        className="text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white"
                      >
                        Lihat Detail →
                      </Link>
                      <button
                        onClick={() => toggleBookmark(m)}
                        title="Hapus Bookmark"
                        className="text-xs text-[#e11d48] hover:underline font-mono"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
