import React, { useState, useEffect } from 'react';
import '../landing.css';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// Common Components
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

// Landing Sections
import HeroSection from '../components/landing/HeroSection';
import AboutSection from '../components/landing/AboutSection';
import StatsBar from '../components/landing/StatsBar';
import MataKuliahSection from '../components/landing/MataKuliahSection';
import ProjectShowcase from '../components/landing/ProjectShowcase';

// Modals
import UploadModal from '../components/modals/UploadModal';
import LoginModal from '../components/modals/LoginModal';
import ProjectDetailModal from '../components/modals/ProjectDetailModal';

// App Context
import useApp from '../hooks/useApp';
import useProjectDetail from '../hooks/useProjectDetail';

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, catalogStatus, currentUser, isLoggedIn, logout, adminSettings, showToast, courses } = useApp();

  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const courseFromUrl = searchParams.get('course') || '';
  const projectId = searchParams.get('project');
  const activeProjectDetail = useProjectDetail(projectId, showToast);

  const handleSelectCourse = (course) => {
    const nextParams = new URLSearchParams(searchParams);
    if (course) nextParams.set('course', course);
    else nextParams.delete('course');
    navigate({ pathname: '/', search: nextParams.toString(), hash: '#projects' }, { replace: true });
    setSelectedCourse(course);
  };

  const handleClearFilters = () => {
    handleSelectCourse('');
    setSelectedSemester('ALL');
    setSearchQuery('');
  };

  useEffect(() => {
    setSelectedCourse(courseFromUrl);
    setSelectedSemester('ALL');
  }, [courseFromUrl]);

  useEffect(() => {
    const target = ['#home', '#about', '#matakuliah', '#projects'].includes(location.hash) ? location.hash.slice(1) : null;
    if (!target) return;
    const frame = requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, [location.hash, courseFromUrl]);

  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('login') === 'required') {
      setIsLoginOpen(true);
    }
  }, [searchParams]);

  const handleOpenDetail = (proj) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('project', proj.id);
    navigate({ pathname: '/', search: nextParams.toString(), hash: location.hash });
  };

  const handleCloseDetail = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('project');
    navigate({ pathname: '/', search: nextParams.toString(), hash: location.hash }, { replace: true, state: location.state });
  };

  // Filter Projects Logic
  const filteredProjects = projects.filter((p) => {
    // Semester filter
    if (selectedSemester !== 'ALL' && p.semester !== selectedSemester) {
      return false;
    }
    // Course filter
    if (selectedCourse && p.course !== selectedCourse) {
      return false;
    }
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title?.toLowerCase().includes(q);
      const matchStudent = p.student?.toLowerCase().includes(q);
      const matchCourse = p.course?.toLowerCase().includes(q);
      const matchTech = p.techStack?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchStudent && !matchCourse && !matchTech) {
        return false;
      }
    }
    return true;
  });

  const handleLoginSuccess = (userRole) => {
    const requestedPath = location.state?.from;
    const canUseRequestedPath =
      typeof requestedPath === 'string' &&
      (requestedPath.startsWith('/student') || /^\/project\/\d+$/.test(requestedPath) || (userRole === 'admin' && requestedPath.startsWith('/admin')));

    navigate(canUseRequestedPath ? requestedPath : projectId && /^\d+$/.test(projectId) ? `/project/${projectId}` : userRole === 'admin' ? '/admin' : '/student', {
      replace: true
    });
  };

  const handleNavigateToStudent = () => {
    if (isLoggedIn) {
      navigate('/student');
    } else {
      navigate('/?login=required', { state: { from: '/student' }, replace: true });
      setIsLoginOpen(true);
      showToast('Silakan masuk untuk mengakses Portal Mahasiswa.', 'info');
    }
  };

  const handleOpenUpload = () => {
    if (adminSettings.maintenanceMode) {
      showToast('Upload sedang dinonaktifkan selama pemeliharaan.', 'info');
      return;
    }
    if (!adminSettings.allowGuestUploads && !isLoggedIn) {
      setIsLoginOpen(true);
      showToast('Silakan masuk sebelum mengunggah projek.', 'info');
      return;
    }
    setIsUploadOpen(true);
  };

  const handleCloseLogin = () => {
    setIsLoginOpen(false);
    if (searchParams.get('login')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('login');
      setSearchParams(nextParams, { replace: true });
    }
  };

  return (
    <div className="landing-page app-canvas flex min-h-screen flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        courses={courses}
        currentPage="landing"
        currentUser={currentUser}
        isLoggedIn={isLoggedIn}
        onOpenUpload={handleOpenUpload}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={logout}
        onNavigateToAdmin={() => navigate('/admin')}
        onNavigateToStudent={handleNavigateToStudent}
        onBackToLanding={() => navigate('/#home')}
        onSelectCourse={handleSelectCourse}
      />

      <main id="main-content">
        {/* Hero Banner Section */}
        <HeroSection
          onOpenUpload={handleOpenUpload}
        />

        {/* About Section */}
        <AboutSection />

        {/* Prestasi Mahasiswa Stats Card */}
        <StatsBar />

        {/* Mata Kuliah Carousel Section */}
        <MataKuliahSection onSelectCourse={handleSelectCourse} selectedCourse={selectedCourse} />

        {/* Projects Showcase Catalog */}
        <ProjectShowcase
          projects={filteredProjects}
          catalogStatus={catalogStatus}
          selectedSemester={selectedSemester}
          selectedCourse={selectedCourse}
          onClearFilters={handleClearFilters}
          onSelectSemester={setSelectedSemester}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClickDetail={handleOpenDetail}
          onNavigateToStudent={handleNavigateToStudent}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={handleCloseLogin}
        onLoginSuccess={handleLoginSuccess}
      />
      <ProjectDetailModal
        project={activeProjectDetail}
        onClose={handleCloseDetail}
        onOpenFullPage={isLoggedIn && activeProjectDetail ? () => navigate(`/project/${activeProjectDetail.id}`) : undefined}
      />
    </div>
  );
}
