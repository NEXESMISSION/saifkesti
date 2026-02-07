import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './components/LoginPage';

const Dashboard = lazy(() => import('./components/Dashboard').then((m) => ({ default: m.Dashboard })));
const BusinessesPage = lazy(() => import('./components/BusinessesPage').then((m) => ({ default: m.BusinessesPage })));
const CategoriesPage = lazy(() => import('./components/CategoriesPage').then((m) => ({ default: m.CategoriesPage })));
const RecapPage = lazy(() => import('./components/RecapPage').then((m) => ({ default: m.RecapPage })));

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-emerald-600" aria-hidden />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Suspense fallback={<PageFallback />}><Dashboard /></Suspense>} />
          <Route path="/businesses" element={<Suspense fallback={<PageFallback />}><BusinessesPage /></Suspense>} />
          <Route path="/categories" element={<Suspense fallback={<PageFallback />}><CategoriesPage /></Suspense>} />
          <Route path="/recap" element={<Suspense fallback={<PageFallback />}><RecapPage /></Suspense>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
