import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { SmartImg, Spinner, ErrorState, timeAgo } from '../components/ui';

export function MangaDetail() {
  const { sourceKey, id } = useParams();
  const { source, continueFor, recordRead } = useApp();
  const navigate = useNavigate();

  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortAsc, setSortAsc] = useState(false); // newest first by default

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    setManga(null);
    setChapters([]);

    Promise.all([source.detail(id), source.chapters(id)])
      .then(([m, ch]) => {
        if (!alive) return;
        setManga(m);
        setChapters(ch);
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'Gagal memuat komik.');
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [source, id]);

  const resume = manga ? continueFor(sourceKey, manga.id) : null;

  // Resolve "first chapter" = lowest number; "last" = highest number.
  const firstCh = chapters.length ? chapters[0] : null;
  const lastCh = chapters.length ? chapters[chapters.length - 1] : null;

  const resumeCh =
    resume &&
    resume.chapterIndex !== undefined &&
    chapters[resume.chapterIndex]
      ? chapters[resume.chapterIndex]
      : resume?.num !== undefined
        ? chapters.find((c) => c.num === resume.num)
        : lastCh;

  const openChapter = (ch, index) => {
    recordRead({ manga, chapter: ch, chapterIndex: index });
    navigate(
      `/${sourceKey}/manga/${encodeURIComponent(id)}/baca/${encodeURIComponent(ch.id)}`
    );
  };

  const shown = sortAsc ? [...chapters].reverse() : chapters;

  if (loading)
    return (
      <div className="mx-auto max-w-[1400px] px-4">
        <Spinner label="Memuat komik" />
      </div>
    );

  if (error)
    return (
      <div className="mx-auto max-w-[1400px] px-4">
        <ErrorState message={error} onRetry={() => navigate(0)} />
      </div>
    );

  return (
    <div className="mx-auto max-w-[1400px] px-4">
      {/* Info panel */}
      <section className="grid grid-cols-1 gap-6 border border-[var(--border)] bg-[var(--surface)] p-5 md:grid-cols-[220px_1fr]">
        <div className="w-40 md:w-full">
          <SmartImg
            src={manga.thumbnail}
            alt={manga.title}
            className="aspect-[3/4] w-full border border-[var(--border)] object-cover object-top"
          />
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl font-black leading-tight md:text-3xl">
            {manga.title}
          </h1>
          {manga.altTitle && (
            <p className="mt-1 text-sm italic text-neutral-500">{manga.altTitle}</p>
          )}

          {/* Metadata */}
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
            <Meta label="Status" value={manga.status} />
            <Meta label="Tipe" value={manga.type} />
            {manga.author && <Meta label="Penulis" value={manga.author} />}
            {manga.artist && <Meta label="Seniman" value={manga.artist} />}
          </dl>

          {manga.genre?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {manga.genre.map((g) => (
                <span
                  key={g}
                  className="border border-[var(--border)] px-2 py-0.5 text-xs text-neutral-400"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {manga.description && (
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-neutral-400">
              {manga.description}
            </p>
          )}

          {/* Primary actions */}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => openChapter(resumeCh || firstCh, chapters.indexOf(resumeCh || firstCh))}
              disabled={!chapters.length}
              className="border border-[var(--accent)] bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--bg)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {resume
                ? `Lanjutkan — ${resume.chapterTitle}`
                : 'Mulai Membaca'}
            </button>
            <button
              onClick={() => openChapter(firstCh, 0)}
              disabled={!chapters.length}
              className="border border-[var(--border)] px-6 py-2.5 text-sm font-semibold text-neutral-300 transition-colors hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Dari Awal
            </button>
          </div>
        </div>
      </section>

      {/* Chapter list */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h2 className="text-lg font-bold uppercase tracking-wide">
            Daftar Chapter{' '}
            <span className="text-sm font-normal text-neutral-500">
              ({chapters.length})
            </span>
          </h2>
          <button
            onClick={() => setSortAsc((v) => !v)}
            className="border border-[var(--border)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {sortAsc ? 'Terlama → Terbaru' : 'Terbaru → Terlama'}
          </button>
        </div>

        <ol className="divide-y divide-[var(--border)]">
          {shown.map((ch) => {
            const index = chapters.indexOf(ch);
            const isResume = resumeCh?.id === ch.id;
            return (
              <li key={ch.id}>
                <button
                  onClick={() => openChapter(ch, index)}
                  className="flex w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:bg-[var(--surface)]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={`shrink-0 text-sm font-bold ${
                        isResume
                          ? 'text-[var(--accent)]'
                          : 'text-neutral-500'
                      }`}
                    >
                      {isResume ? '● ' : ''}
                      {ch.num ?? '–'}
                    </span>
                    <span className="truncate text-sm text-neutral-200">
                      {ch.name}
                    </span>
                  </span>
                  {ch.releaseAt && (
                    <span className="shrink-0 text-xs text-neutral-500">
                      {timeAgo(ch.releaseAt)}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function Meta({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-neutral-600">{label}</dt>
      <dd className="text-neutral-300">{value}</dd>
    </div>
  );
}
