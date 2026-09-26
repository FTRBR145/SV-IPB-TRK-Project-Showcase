import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseLabel } from '../../utils/courseLabel';
import {
  ChevronDown,
  LogIn,
  Upload,
  Shield,
  Menu,
  X,
  Search,
  LogOut,
  User,
  PlaySquare,
  Home
} from 'lucide-react';

const EMPTY_COURSES = [];

export default function Navbar({
  currentPage = 'landing', // 'landing' | 'student' | 'admin'
  currentUser = null,
  isLoggedIn = false,
  searchQuery = '',
  onSearchChange,
  onOpenUpload,
  onOpenLogin,
  onLogout,
  onNavigateToAdmin,
  onNavigateToStudent,
  onBackToLanding,
  onSelectCourse,
  courses = EMPTY_COURSES
}) {
  const navigate = useNavigate();
  const isAdmin = isLoggedIn && currentUser?.role === 'admin';
  const isStudent = isLoggedIn && currentUser?.role === 'student';
  const isLanding = currentPage === 'landing';
  const isStudentPage = currentPage === 'student' || currentPage === 'student-upload';
  const accountLinks = [
    ...(isLoggedIn ? [{ label: 'Akun Saya', icon: User, action: () => navigate('/account') }] : []),
    ...(!isLanding && onBackToLanding ? [{ label: 'Beranda Publik', icon: Home, action: onBackToLanding }] : []),
    ...(isAdmin && currentPage !== 'admin' && onNavigateToAdmin ? [{ label: 'Dashboard Admin', icon: Shield, action: onNavigateToAdmin }] : []),
    ...(isStudent && currentPage !== 'student' && onNavigateToStudent ? [{ label: 'Portal Mahasiswa', icon: PlaySquare, action: onNavigateToStudent }] : []),
    ...(isAdmin && !isStudentPage && onNavigateToStudent ? [{ label: 'Pratinjau Portal Mahasiswa', icon: PlaySquare, action: onNavigateToStudent }] : []),
    ...(isStudent && onOpenUpload ? [{ label: 'Unggah Projek', icon: Upload, action: onOpenUpload }] : [])
  ];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const courseDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    onScroll(); // check initial state
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (userDropdownOpen) userDropdownRef.current?.querySelector('button')?.focus();
        else if (courseDropdownOpen) courseDropdownRef.current?.querySelector('button')?.focus();
        setMobileMenuOpen(false);
        setCourseDropdownOpen(false);
        setUserDropdownOpen(false);
      }
    };
    const handleClickOutside = (e) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(e.target)) {
        setCourseDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen, courseDropdownOpen]);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setCourseDropdownOpen(false);
  };

  return (
    <header className={`sticky top-0 z-50 bg-white border-b transition-colors duration-200 ${isScrolled ? 'navbar-scrolled border-slate-200/95' : 'border-slate-200'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:gap-4 sm:px-6 lg:px-8">
        {/* =================================================================== */}
        {/* BRAND LOGO (OFFICIAL SV IPB) */}
        {/* =================================================================== */}
        <button
          type="button"
          onClick={onBackToLanding}
          className="group flex min-h-11 min-w-0 shrink-0 items-center gap-2.5 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          title="Beranda Showcase TRK SV IPB"
        >
          <img
            src="/sv_ipb_navbar_logo.png"
            alt="IPB University Sekolah Vokasi Logo"
            className="h-9 max-w-[145px] object-contain sm:h-14 sm:max-w-[270px]"
          />
          {!isLanding && <span className="hidden border-l border-slate-200 pl-3 text-sm font-semibold text-slate-600 md:inline">{currentPage === 'account' ? 'Akun Saya' : currentPage === 'admin' ? 'Admin' : 'Mahasiswa'}</span>}
        </button>

        {/* =================================================================== */}
        {/* CENTER SEARCH BAR / NAVIGATION LINKS */}
        {/* =================================================================== */}
        {currentPage === 'student' && onSearchChange ? (
          <div className="hidden max-w-xl flex-1 items-center justify-center px-4 xl:flex">
            <div className="relative w-full">
              <label htmlFor="student-project-search" className="sr-only">Telusuri projek mahasiswa</label>
              <input
                id="student-project-search"
                type="text"
                placeholder="Telusuri projek TRK, sensor, dosen, atau mata kuliah..."
                value={searchQuery}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-500 transition-colors focus:border-sky-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange && onSearchChange('')}
                  type="button"
                  className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                  aria-label="Hapus pencarian"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        ) : !isLanding ? (
          <div className="hidden md:block flex-1" />
        ) : (
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 xl:flex">
            <a
              href="#home"
              className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 font-semibold text-slate-900 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            >
              Home
            </a>
            <a
              href="#about"
              className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            >
              Tentang
            </a>

            {/* Mata Kuliah Dropdown */}
            <div ref={courseDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setCourseDropdownOpen((open) => !open)}
                aria-expanded={courseDropdownOpen}
                className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              >
                <span>Mata Kuliah</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${courseDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {courseDropdownOpen && (
                <div
                  role="group"
                  aria-label="Katalog Mata Kuliah"
                  className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                >
                  {['Semua Mata Kuliah', ...courses].map((course) => (
                    <a
                      key={course}
                      href="#projects"
                      className="flex min-h-11 items-center px-4 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:bg-slate-50 focus-visible:text-slate-900"
                      onClick={() => {
                        onSelectCourse?.(course === 'Semua Mata Kuliah' ? '' : course);
                        setCourseDropdownOpen(false);
                      }}
                    >
                      {courseLabel(course)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </nav>
        )}

        {/* =================================================================== */}
        {/* RIGHT ACTION BUTTONS & USER PROFILE */}
        {/* =================================================================== */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* User Profile / Login */}
          {isLoggedIn && currentUser ? (
            <div ref={userDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-1.5 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                aria-label={`Menu akun ${currentUser.name}`}
                aria-expanded={userDropdownOpen}
              >
                <User size={15} className="text-slate-600" />
                <span className="hidden sm:inline text-xs font-bold text-slate-800 max-w-[130px] truncate text-left">
                  {currentUser.name}
                </span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div role="group" aria-label="Opsi Akun" className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-xs font-mono text-slate-600 break-all">
                      {currentUser.nim || currentUser.email}
                    </p>
                  </div>
                  {accountLinks.map(({ label, icon: Icon, action }) => <button
                    key={label} type="button"
                    onClick={() => { action(); closeMobileMenu(); }}
                    className="flex min-h-11 w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:bg-slate-50"
                  ><Icon size={16} /><span>{label}</span></button>)}
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout?.();
                      closeMobileMenu();
                    }}
                    className="flex min-h-11 w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:bg-rose-50"
                  >
                    <LogOut size={14} />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="flex min-h-11 items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              onClick={onOpenLogin}
            >
              <LogIn size={14} />
              <span>Login</span>
            </button>
          )}

          {/* Public navigation on smaller screens */}
          {isLanding && <button
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 xl:hidden"
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>}
        </div>
      </div>

      {/* =================================================================== */}
      {/* MOBILE EXPANDED MENU */}
      {/* =================================================================== */}
      {isLanding && mobileMenuOpen && (
        <div className="space-y-3 border-t border-slate-200 bg-white px-4 py-4 shadow-xl animate-in slide-in-from-top-2 duration-200 xl:hidden">
          {/* Links */}
          <div className="space-y-1 pt-1">
            {currentPage === 'landing' && (
              <>
                <a href="#about" onClick={closeMobileMenu} className="flex min-h-11 items-center px-3 text-sm text-slate-700">Tentang</a>
                <a href="#matakuliah" onClick={closeMobileMenu} className="flex min-h-11 items-center px-3 text-sm text-slate-700">Mata Kuliah</a>
              </>
            )}
            <button
              onClick={() => {
                if (currentPage === 'landing') window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
                else onBackToLanding?.();
                closeMobileMenu();
              }}
              className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-slate-100"
            >
              <Home size={15} />
              <span>Home</span>
            </button>
          </div>


        </div>
      )}
    </header>
  );
}
