import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Toast from './components/common/Toast';
import ScrollToTop from './components/common/ScrollToTop';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ROUTE_ACCESS } from './utils/accessControl';
import useApp from './hooks/useApp';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const StudentHome = lazy(() => import('./pages/StudentHome'));
const UploadProjectPage = lazy(() => import('./pages/UploadProjectPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" aria-hidden="true" />
        Memuat halaman...
      </div>
    </div>
  );
}

function PublicDataFeedback() {
  const { publicDataError, publicDataLoading, refreshPublicData } = useApp();
  if (!publicDataError) return null;
  return (
    <div role="alert" className="fixed inset-x-4 top-20 z-[60] flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 shadow-md sm:left-auto sm:right-6 sm:top-24 sm:max-w-sm">
      <p className="min-w-0 flex-1">Data pendukung belum lengkap. Pilihan atau pengaturan mungkin belum terbaru.</p>
      <button type="button" onClick={refreshPublicData} disabled={publicDataLoading}
        className="min-h-11 rounded-lg border border-amber-700 px-4 py-2 font-semibold hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900 disabled:cursor-wait disabled:opacity-60">
        {publicDataLoading ? 'Memuat ulang...' : 'Coba lagi'}
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <a href="#main-content" className="skip-link">Lewati ke konten utama</a>
          <ScrollToTop />
          <Suspense fallback={<RouteLoader />}>
            <Routes>
            {/* Landing Public Page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/project/:projectId" element={<LandingPage />} />
            <Route path="/account" element={<ProtectedRoute allowedRoles={['student', 'admin', 'lecturer']}><ProfilePage /></ProtectedRoute>} />

            {/* Authenticated Student Portal (TRKTube Beranda) */}
            <Route
              path="/student"
              element={(
                <ProtectedRoute allowedRoles={ROUTE_ACCESS.studentPortal}>
                  <StudentHome />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/student/upload"
              element={(
                <ProtectedRoute allowedRoles={ROUTE_ACCESS.studentUpload}>
                  <UploadProjectPage />
                </ProtectedRoute>
              )}
            />
            <Route path="/beranda" element={<Navigate to="/student" replace />} />

            {/* Admin / Dosen Moderation Dashboard */}
            <Route
              path="/admin"
              element={(
                <ProtectedRoute allowedRoles={ROUTE_ACCESS.admin}>
                  <AdminDashboard />
                </ProtectedRoute>
              )}
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <PublicDataFeedback />
          <Toast />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
