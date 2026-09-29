import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Plus, Search, X } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import CatalogFeedback from '../components/common/CatalogFeedback';
import { isAdminAccount, isStudentAccount } from '../utils/accessControl';
import StudentProjectCard from '../components/student/StudentProjectCard';
import { matchesStudentProject, isEmptyPortfolio } from '../utils/studentFeed';
import { courseLabel } from '../utils/courseLabel';
import '../student.css';
import ProjectDetailModal from '../components/modals/ProjectDetailModal';
import StudentSidebar from '../components/student/StudentSidebar';
import EditProjectModal from '../components/admin/EditProjectModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import useApp from '../hooks/useApp';


const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6];
const PAGE_SIZE = 6;

function belongsToStudent(project, student) {
  if (!project || !student) return false;

  // NIM adalah identitas unik: kalau keduanya ada, itu penentu tunggal.
  if (project.nim && student.nim) {
    return String(project.nim) === String(student.nim);
  }

  // Fallback nama, exact match saja agar "Adi" tidak mengklaim projek "Hadi".
  const projectStudent = project.student?.trim().toLowerCase();
  const studentName = student.name?.trim().toLowerCase();
  return Boolean(projectStudent && studentName && projectStudent === studentName);
}

export default function StudentHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, ownProjects, catalogStatus, submissions, currentUser, isLoggedIn, logout, courses,
    updateProject, deleteProject, updateSubmission, deletePendingSubmission } = useApp();
  const isAdminPreview = isAdminAccount(currentUser);
  const studentUser = isStudentAccount(currentUser) ? currentUser : null;

  const selectedSemester = searchParams.get('semester') || 'ALL';
  const searchQuery = searchParams.get('search') || '';
  const [visibleProjectCount, setVisibleProjectCount] = useState(PAGE_SIZE);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // URL jadi sumber kebenaran tab & kategori, bukan state lokal.
  const activeTab = !isAdminPreview && searchParams.get('tab') === 'my-projects' ? 'my-projects' : 'home';
  const selectedCategory =
    searchParams.get('course') || (activeTab === 'my-projects' ? 'Projek Saya' : 'Semua');

  useEffect(() => {
    if (!isLoggedIn || !currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, isLoggedIn, navigate]);

  useEffect(() => {
    const legacyProjectId = searchParams.get('project');
    if (!legacyProjectId || !/^\d+$/.test(legacyProjectId)) return;
    const returnParams = new URLSearchParams(searchParams);
    returnParams.delete('project');
    navigate(`/project/${legacyProjectId}`, { replace: true, state: { from: `/student${returnParams.size ? `?${returnParams}` : ''}` } });
  }, [navigate, searchParams]);

  const myPendingSubmissions = useMemo(() => {
    if (!studentUser) return [];
    return (submissions || [])
      .filter(
        (item) =>
          item.status === 'pending' &&
          belongsToStudent(item, studentUser)
      )
      .map((item) => ({
        ...item,
        status: 'pending',
        isPending: true
      }));
  }, [submissions, studentUser]);

  const myPublishedProjects = studentUser ? ownProjects : [];

  const myProjects = useMemo(
    () => [...myPendingSubmissions, ...myPublishedProjects],
    [myPendingSubmissions, myPublishedProjects]
  );

  const pendingId = searchParams.get('submission');
  const activeDetailProject = pendingId
    ? myPendingSubmissions.find(item => String(item.id) === pendingId) ?? null
    : null;

  const filteredProjects = useMemo(() => {
    const baseProjects = activeTab === 'my-projects' ? myProjects : projects;
    return baseProjects.filter(project => matchesStudentProject(project, { search: searchQuery, semester: selectedSemester, course: selectedCategory }));
  }, [activeTab, myProjects, projects, searchQuery, selectedCategory, selectedSemester]);

  const visibleProjects = filteredProjects.slice(0, visibleProjectCount);
  const remainingProjectCount = filteredProjects.length - visibleProjects.length;

  const resetVisibleProjects = () => setVisibleProjectCount(PAGE_SIZE);

  const updateParams = (mutate, replace = false) => {
    const nextParams = new URLSearchParams(searchParams);
    mutate(nextParams);
    setSearchParams(nextParams, { replace });
  };

  const handleSearchChange = (value) => {
    updateParams(params => value ? params.set('search', value) : params.delete('search'), true);
    resetVisibleProjects();
  };

  const handleOpenDetail = (project) => {
    if (!project.isPending) {
      navigate(`/project/${project.id}`, { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    updateParams(params => params.set('submission', project.id));
  };

  const handleCloseDetail = () => {
    updateParams(params => params.delete('submission'));
  };

  const handleTogglePublication = async (project) => {
    if (togglingId !== null) return;
    setTogglingId(project.id);
    try { await updateProject(project.id, { isPublished: project.isPublished === false }); }
    finally { setTogglingId(null); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return false;
    return deleteTarget.isPending
      ? deletePendingSubmission(deleteTarget.id)
      : deleteProject(deleteTarget.id);
  };

  const showAllProjects = () => {
    updateParams(params => { params.delete('tab'); params.delete('course'); params.delete('semester'); });
    resetVisibleProjects();
  };

  const showMyProjects = () => {
    updateParams((params) => {
      params.set('tab', 'my-projects');
      params.delete('course');
    });
    resetVisibleProjects();
  };

  const selectCourse = (course) => {
    updateParams((params) => {
      params.delete('tab');
      params.set('course', course);
    });
    resetVisibleProjects();
  };

  const resetFilters = () => {
    updateParams(params => { params.delete('course'); params.delete('semester'); params.delete('search'); });
    resetVisibleProjects();
  };

  // Jangan render apa pun selagi redirect berjalan.
  if (!isLoggedIn || !currentUser) return null;

  const personal = activeTab === 'my-projects';
  const hasCourse = selectedCategory !== 'Semua' && selectedCategory !== 'Projek Saya';
  const hasFilters = hasCourse || selectedSemester !== 'ALL' || Boolean(searchQuery);
  const trulyEmpty = isEmptyPortfolio(activeTab, myProjects.length);
  const removeFilter = key => {
    updateParams(params => params.delete(key));
    resetVisibleProjects();
  };

  return (
    <div className="student-page app-canvas flex h-screen h-dvh flex-col overflow-hidden pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Navbar courses={courses} currentPage="student" currentUser={currentUser} isLoggedIn={isLoggedIn}
        onLogout={logout} onNavigateToAdmin={() => navigate('/admin')} onNavigateToStudent={showAllProjects} onBackToLanding={() => navigate('/')} />
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="flex min-h-[calc(100dvh-4rem)] items-stretch sm:min-h-[calc(100dvh-5rem)]">
          <StudentSidebar courses={courses} activeItem={activeTab} selectedCategory={selectedCategory} projectCount={myProjects.length}
            onSelectHome={showAllProjects} onNavigateUpload={studentUser ? () => navigate('/student/upload') : undefined}
            onSelectMyProjects={showMyProjects} onSelectCourse={selectCourse} onNavigateAdmin={() => navigate('/admin')}
            showAdmin={isAdminPreview} showStudentActions={Boolean(studentUser)} />
          <main id="main-content" className="student-main min-w-0 flex-1">
            <header className="student-heading">
              <h1>{personal ? 'Projek Saya' : 'Jelajah Karya'}</h1>
              <p>{isAdminPreview ? 'Pratinjau mahasiswa · pengelolaan tetap melalui panel admin.' : personal ? 'Dokumentasi karya dan status pengajuan Anda.' : `Selamat datang, ${studentUser?.name || currentUser.name}. Temukan referensi untuk projek berikutnya.`}</p>
            </header>
            <div className="student-filters" role="search" aria-label="Filter karya mahasiswa">
              <div className="student-search">
                <Search size={18} aria-hidden="true" />
                <input type="search" aria-label="Cari projek" placeholder="Cari judul, mahasiswa, dosen, teknologi…" value={searchQuery} onChange={event => handleSearchChange(event.target.value)} />
                {searchQuery && <button type="button" aria-label="Hapus pencarian" onClick={() => handleSearchChange('')}><X size={18} /></button>}
              </div>
              <select aria-label="Filter semester" value={selectedSemester} onChange={event => {
                updateParams(params => event.target.value === 'ALL' ? params.delete('semester') : params.set('semester', event.target.value));
                resetVisibleProjects();
              }}>
                <option value="ALL">Semua semester</option>
                {SEMESTER_OPTIONS.map(value => <option key={value} value={value}>Semester {value}</option>)}
              </select>
            </div>
            <div className="student-results-bar">
              {catalogStatus === 'ready' && <p role="status" aria-live="polite" aria-atomic="true">{filteredProjects.length} projek{hasFilters ? ' cocok dengan filter' : personal ? ' dalam portofolio Anda' : ' untuk dijelajahi'}</p>}
              {hasFilters && <button type="button" onClick={resetFilters}>Hapus semua filter</button>}
            </div>
            {hasFilters && <div className="student-filter-chips" aria-label="Filter aktif">
              {hasCourse && <button type="button" onClick={() => removeFilter('course')} aria-label={`Hapus filter mata kuliah ${courseLabel(selectedCategory)}`}>{courseLabel(selectedCategory)}<X size={14} /></button>}
              {selectedSemester !== 'ALL' && <button type="button" onClick={() => removeFilter('semester')} aria-label="Hapus filter semester">Semester {selectedSemester}<X size={14} /></button>}
              {searchQuery && <button type="button" onClick={() => handleSearchChange('')} aria-label="Hapus kata pencarian">“{searchQuery}”<X size={14} /></button>}
            </div>}
            {personal && myPendingSubmissions.length > 0 && <p className="student-pending-note"><Clock size={18} aria-hidden="true" /><span>{myPendingSubmissions.length} pengajuan menunggu persetujuan. Hanya Anda yang dapat melihatnya sampai diterbitkan admin.</span></p>}
            <CatalogFeedback />
            {catalogStatus !== 'ready' ? null : filteredProjects.length === 0 ? (
              <section className="student-empty" aria-labelledby="student-empty-title">
                <Search size={28} aria-hidden="true" />
                <h2 id="student-empty-title">{trulyEmpty ? 'Belum ada projek milik Anda' : 'Tidak ada projek yang cocok'}</h2>
                <p>{trulyEmpty ? 'Mulai portofolio Anda dengan mengunggah dokumentasi projek pertama.' : 'Coba kata kunci lain atau hapus filter. Projek yang sudah tersimpan tetap ada.'}</p>
                <button type="button" className="student-primary" onClick={trulyEmpty ? () => navigate('/student/upload') : resetFilters}>
                  {trulyEmpty ? <><Plus size={18} />Unggah Projek</> : 'Hapus filter'}
                </button>
              </section>
            ) : <div className="student-project-grid">{visibleProjects.map(project =>
              <StudentProjectCard
                key={`${project.status || 'published'}-${project.id}`}
                project={project}
                isOwner={Boolean(personal && studentUser?.nim && String(project.nim) === String(studentUser.nim))}
                onOpen={handleOpenDetail}
                onEdit={personal ? setEditingProject : undefined}
                onTogglePublication={personal ? handleTogglePublication : undefined}
                onDelete={personal ? setDeleteTarget : undefined}
                isToggling={togglingId === project.id}
              />
            )}</div>}
            {catalogStatus === 'ready' && remainingProjectCount > 0 && <div className="student-load-more"><button type="button" onClick={() => setVisibleProjectCount(count => count + PAGE_SIZE)}>
              Tampilkan {Math.min(PAGE_SIZE, remainingProjectCount)} projek berikutnya <span>({remainingProjectCount} tersisa)</span>
            </button></div>}
          </main>
        </div>
        <Footer />
      </div>
      {activeDetailProject && <ProjectDetailModal project={activeDetailProject} onClose={handleCloseDetail} />}
      {editingProject && (
        <EditProjectModal
          key={`${editingProject.isPending ? 'submission' : 'project'}-${editingProject.id}`}
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={editingProject.isPending ? updateSubmission : updateProject}
          title={editingProject.isPending ? 'Edit Pengajuan' : 'Edit Projek'}
          description={editingProject.isPending
            ? 'Perbarui informasi projek sebelum ditinjau admin. Statusnya tetap menunggu persetujuan.'
            : 'Perubahan isi projek langsung tampil. Admin dapat melihat perbandingan perubahannya.'}
          submitLabel={editingProject.isPending ? 'Simpan Pengajuan' : 'Simpan Perubahan'}
        />
      )}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget?.isPending ? 'Batalkan pengajuan?' : 'Hapus projek permanen?'}
        description={deleteTarget?.isPending
          ? `Pengajuan “${deleteTarget.title}” akan dihapus dan tidak lagi ditinjau admin.`
          : `Projek “${deleteTarget?.title || ''}” akan dihapus permanen dari portofolio dan halaman publik. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={deleteTarget?.isPending ? 'Batalkan pengajuan' : 'Hapus projek'}
      />
    </div>
  );
}
