import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Copy, User } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ProjectDetailContent from '../components/projects/ProjectDetailContent';
import { getProjectById } from '../services/projectApi';
import { courseLabel } from '../utils/courseLabel';
import useApp from '../hooks/useApp';
import '../components/modals/ProjectDetailModal.css';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isLoggedIn, logout, adminSettings, courses } = useApp();
  const [requestNumber, setRequestNumber] = useState(0);
  const [result, setResult] = useState({ status: 'loading', project: null });
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    if (!/^\d+$/.test(projectId || '')) {
      setResult({ status: 'not-found', project: null });
      return undefined;
    }
    const controller = new AbortController();
    setResult({ status: 'loading', project: null });
    getProjectById(projectId, { signal: controller.signal }).then(project => {
      if (!controller.signal.aborted) setResult({ status: 'ready', project });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ status: error.status === 404 ? 'not-found' : 'error', project: null });
    });
    return () => controller.abort();
  }, [projectId, requestNumber]);

  useEffect(() => { setCopyStatus(''); }, [projectId]);

  useEffect(() => {
    const siteName = adminSettings.siteName || 'Showcase TRK';
    document.title = result.project ? `${result.project.title} | ${siteName}` : siteName;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = result.project
      ? `Projek ${result.project.title} oleh ${result.project.student} untuk ${courseLabel(result.project.course)}.`
      : 'Karya mahasiswa Teknologi Rekayasa Komputer Sekolah Vokasi IPB.';
    return () => { document.title = siteName; };
  }, [adminSettings.siteName, result.project]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/project/${projectId}`);
      setCopyStatus('Tautan projek tersalin.');
    } catch {
      setCopyStatus('Tidak dapat menyalin otomatis. Salin tautan dari bilah alamat.');
    }
  };

  const project = result.project;
  return <div className="app-canvas flex min-h-screen flex-col bg-slate-50">
    <Navbar currentPage="project" currentUser={currentUser} isLoggedIn={isLoggedIn} courses={courses}
      onLogout={logout} onBackToLanding={() => navigate('/#projects')}
      onOpenLogin={() => navigate('/?login=required')}
      onNavigateToAdmin={() => navigate('/admin')} onNavigateToStudent={() => navigate('/student')} />
    <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link to="/#projects" className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-700 hover:text-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"><ArrowLeft size={18} aria-hidden="true" />Kembali ke katalog</Link>
      {result.status === 'loading' && <p role="status" className="py-24 text-center text-slate-600">Memuat detail projek...</p>}
      {result.status === 'not-found' && <div className="py-24 text-center"><h1 className="font-heading text-3xl font-semibold text-slate-900">Projek tidak ditemukan</h1><p className="mt-3 text-slate-600">Projek ini mungkin sudah dihapus atau tidak ditayangkan.</p></div>}
      {result.status === 'error' && <div className="py-24 text-center"><h1 className="font-heading text-3xl font-semibold text-slate-900">Detail projek belum dapat dimuat</h1><p className="mt-3 text-slate-600">Periksa koneksi lalu coba kembali.</p><button type="button" onClick={() => setRequestNumber(value => value + 1)} className="mt-6 min-h-11 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800">Coba lagi</button></div>}
      {project && <article className="project-detail-page">
        <header className="mb-8 border-b border-slate-200 pb-8">
          <h1 className="max-w-4xl font-heading text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">{project.title}</h1>
          <p className="project-detail-author mt-4"><User size={16} aria-hidden="true" /><span>{project.student}{project.nim && <span> · NIM {project.nim}</span>}</span></p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {project.isPublished !== false && <button type="button" onClick={copyLink} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"><Copy size={16} aria-hidden="true" />Salin tautan</button>}
            {copyStatus && <span role="status" className="inline-flex items-center gap-1 text-sm text-slate-700">{copyStatus.startsWith('Tautan') && <Check size={16} aria-hidden="true" />}{copyStatus}</span>}
          </div>
        </header>
        <ProjectDetailContent project={project} headingLevel={2} />
      </article>}
    </main>
    <Footer />
  </div>;
}
