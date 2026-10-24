import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './store';
import { Layout } from './pages/Layout';
import { Home } from './pages/Home';
import { MangaDetail } from './pages/MangaDetail';
import { Reader } from './pages/Reader';
import { Pustaka } from './pages/Pustaka';
import { Genre } from './pages/Genre';
import { SearchResults } from './pages/SearchResults';
import { Riwayat } from './pages/Riwayat';

function RedirectToSourcePath({ path }) {
  const { sourceKey } = useApp();
  const location = useLocation();
  return <Navigate to={`/${sourceKey}/${path}${location.search}`} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Pustaka / Library */}
        <Route path="/:sourceKey/pustaka" element={<Pustaka />} />
        <Route path="/pustaka" element={<RedirectToSourcePath path="pustaka" />} />

        {/* Genre */}
        <Route path="/:sourceKey/genre" element={<Genre />} />
        <Route path="/:sourceKey/genre/:genreSlug" element={<Genre />} />
        <Route path="/genre" element={<RedirectToSourcePath path="genre" />} />

        {/* Search */}
        <Route path="/:sourceKey/search" element={<SearchResults />} />
        <Route path="/search" element={<RedirectToSourcePath path="search" />} />

        {/* History / Riwayat & Bookmarks */}
        <Route path="/riwayat" element={<Riwayat />} />

        {/* Manga Detail */}
        <Route path="/:sourceKey/manga/:id" element={<MangaDetail />} />

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* Fullscreen Webtoon Reader (custom focused layout) */}
      <Route path="/:sourceKey/manga/:id/baca/:chapterId" element={<Reader />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
