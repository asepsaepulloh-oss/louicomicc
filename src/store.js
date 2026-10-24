import { createContext, useContext, useEffect, useState } from 'react';
import { SOURCES } from './api';

const AppCtx = createContext(null);

const LS_SOURCE = 'louicomric.source';

const emptyHistory = { entries: [] };

function loadHistory() {
  try {
    const raw = localStorage.getItem('louicomric.history');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.entries)) return parsed;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { ...emptyHistory, entries: [] };
}

export function AppProvider({ children }) {
  const [sourceKey, setSourceKey] = useState(() => {
    try {
      return localStorage.getItem(LS_SOURCE) === 'komiku' ? 'komiku' : 'shinigami';
    } catch {
      return 'shinigami';
    }
  });
  const [history, setHistory] = useState(loadHistory);

  useEffect(() => {
    try {
      localStorage.setItem('louicomric.history', JSON.stringify(history));
    } catch {
      /* storage full — skip */
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_SOURCE, sourceKey);
    } catch {
      /* ignore */
    }
  }, [sourceKey]);

  const source = sourceFor(sourceKey);

  /**
   * Record a read chapter. Merges into the per-manga entry, keeping the most
   * recent chapter so "Continue" always resumes at the latest position.
   */
  const recordRead = ({ manga, chapter, chapterIndex }) => {
    setHistory((prev) => {
      const entries = [...prev.entries];
      const idx = entries.findIndex(
        (e) => e.source === manga.source && e.id === manga.id
      );
      const entry = {
        source: manga.source,
        id: manga.id,
        title: manga.title,
        thumbnail: manga.thumbnail,
        chapter: chapter.id,
        chapterTitle: chapter.name ?? chapter.id,
        chapterNum: chapter.num,
        chapterIndex,
        updatedAt: Date.now(),
      };
      if (idx >= 0) entries.splice(idx, 1);
      entries.unshift(entry);
      return { entries: entries.slice(0, 50) };
    });
  };

  /** Latest read chapter for a manga, or null. */
  const continueFor = (source_, id) =>
    history.entries.find((e) => e.source === source_ && e.id === id) || null;

  return (
    <AppCtx.Provider
      value={{ source, sourceKey, setSourceKey, sourceList: SOURCES, history, recordRead, continueFor }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  return useContext(AppCtx);
}

function sourceFor(key) {
  return SOURCES[key] || SOURCES.shinigami;
}
