import { createContext, useContext, useEffect, useState } from 'react';
import { SOURCES } from './api';

const AppCtx = createContext(null);

const LS_SOURCE = 'louicomic.source';
const LS_HISTORY = 'louicomic.history';
const LS_BOOKMARKS = 'louicomic.bookmarks';

function loadHistory() {
  try {
    const raw = localStorage.getItem(LS_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.entries)) return parsed;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { entries: [] };
}

function loadBookmarks() {
  try {
    const raw = localStorage.getItem(LS_BOOKMARKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function AppProvider({ children }) {
  const [sourceKey, setSourceKey] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_SOURCE);
      return saved === 'komiku' ? 'komiku' : 'shinigami';
    } catch {
      return 'shinigami';
    }
  });

  const [history, setHistory] = useState(loadHistory);
  const [bookmarks, setBookmarks] = useState(loadBookmarks);

  useEffect(() => {
    try {
      localStorage.setItem(LS_HISTORY, JSON.stringify(history));
    } catch {
      /* ignore storage full */
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_SOURCE, sourceKey);
    } catch {
      /* ignore */
    }
  }, [sourceKey]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_BOOKMARKS, JSON.stringify(bookmarks));
    } catch {
      /* ignore */
    }
  }, [bookmarks]);

  const source = SOURCES[sourceKey] || SOURCES.shinigami;

  const recordRead = ({ manga, chapter, chapterIndex }) => {
    if (!manga || !chapter) return;
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
        type: manga.type || 'Manga',
        chapterId: chapter.id,
        chapterTitle: chapter.name || `Chapter ${chapter.num ?? ''}`,
        chapterNum: chapter.num ?? null,
        chapterIndex: chapterIndex ?? 0,
        updatedAt: Date.now(),
      };
      if (idx >= 0) entries.splice(idx, 1);
      entries.unshift(entry);
      return { entries: entries.slice(0, 100) };
    });
  };

  const continueFor = (source_, id) => {
    return history.entries.find((e) => e.source === source_ && e.id === id) || null;
  };

  const clearHistory = () => {
    setHistory({ entries: [] });
  };

  const removeHistoryItem = (source_, id) => {
    setHistory((prev) => ({
      entries: prev.entries.filter((e) => !(e.source === source_ && e.id === id)),
    }));
  };

  const toggleBookmark = (manga) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.source === manga.source && b.id === manga.id);
      if (exists) {
        return prev.filter((b) => !(b.source === manga.source && b.id === manga.id));
      }
      return [
        {
          source: manga.source,
          id: manga.id,
          title: manga.title,
          thumbnail: manga.thumbnail,
          type: manga.type || 'Manga',
          addedAt: Date.now(),
        },
        ...prev,
      ];
    });
  };

  const isBookmarked = (source_, id) => {
    return bookmarks.some((b) => b.source === source_ && b.id === id);
  };

  return (
    <AppCtx.Provider
      value={{
        source,
        sourceKey,
        setSourceKey,
        sourceList: SOURCES,
        history,
        recordRead,
        continueFor,
        clearHistory,
        removeHistoryItem,
        bookmarks,
        toggleBookmark,
        isBookmarked,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
