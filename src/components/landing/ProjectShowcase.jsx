import React, { useEffect, useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import ProjectCard from '../projects/ProjectCard';
import { courseLabel } from '../../utils/courseLabel';
import CatalogFeedback from '../common/CatalogFeedback';

const PAGE_SIZE = 6;

export default function ProjectShowcase({
  projects,
  catalogStatus,
  selectedSemester,
  selectedCourse,
  onClearFilters,
  onSelectSemester,
  searchQuery,
  onSearchChange,
  onClickDetail,
  onNavigateToStudent
}) {
  const semesters = ['ALL', 1, 2, 3, 4, 5, 6, 7, 8];
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const hasFilters = Boolean(selectedCourse || selectedSemester !== 'ALL' || searchQuery.trim());

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedSemester, selectedCourse, searchQuery]);

  const remainingCount = Math.max(0, projects.length - visibleCount);

  return (
    <section id="projects" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2
              className="font-heading text-2xl sm:text-3xl font-semibold text-slate-800"
            >
              {selectedCourse ? `Projek Mata Kuliah: ${courseLabel(selectedCourse)}` : 'Projek TRK Terbaru'}
            </h2>
            <p
              className="text-slate-600 text-sm mt-1"
            >
              {selectedCourse
                ? 'Menampilkan karya mahasiswa dari mata kuliah yang Anda pilih.'
                : 'Jelajahi karya mahasiswa TRK Sekolah Vokasi IPB tanpa perlu masuk akun.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {selectedCourse && <button type="button" onClick={onClearFilters}
              className="min-h-11 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition-colors hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
              Lihat semua projek
            </button>}
            <button
              type="button"
              onClick={onNavigateToStudent}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            >
              Buka Portal Mahasiswa <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Controls: Semester Tabs & Search */}
        <div
          className="flex min-w-0 flex-col gap-4 mb-8"
        >
          <div
            className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-1.5"
            role="group"
            aria-label="Filter berdasarkan semester"
          >
            {semesters.map((sem) => (
              <button
                key={sem}
                aria-pressed={selectedSemester === sem}
                className={`min-h-11 min-w-0 w-full px-1.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 sm:w-auto sm:px-3.5 ${
                  selectedSemester === sem
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                onClick={() => onSelectSemester(sem)}
              >
                {sem === 'ALL' ? 'Semua' : `Semester ${sem}`}
              </button>
            ))}
          </div>

          <div className="relative w-full min-w-0 sm:max-w-md">
            <label htmlFor="project-search" className="sr-only">Cari projek</label>
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="project-search"
              type="text"
              placeholder="Cari judul, mahasiswa, atau teknologi"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-10 pr-4 text-base text-slate-800 placeholder-slate-500 transition-colors focus:border-sky-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 sm:text-sm"
            />
          </div>
        </div>

        {catalogStatus === 'ready' && hasFilters && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 text-sm text-slate-600" role="status">
            <span>{projects.length} projek ditemukan{selectedSemester !== 'ALL' ? ` · Semester ${selectedSemester}` : ''}{searchQuery.trim() ? ` · Pencarian: “${searchQuery.trim()}”` : ''}</span>
            {!selectedCourse && <button type="button" onClick={onClearFilters} className="min-h-11 font-semibold underline underline-offset-4 text-slate-900">Hapus semua filter</button>}
          </div>
        )}
        {/* Projects Grid */}
        <CatalogFeedback />
        {catalogStatus !== 'ready' ? null : projects.length > 0 ? (
          <div key={`${selectedSemester}:${selectedCourse}`} className="catalog-results grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, visibleCount).map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClickDetail={onClickDetail}
                motionIndex={Math.min(index, 5)}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <h3 className="font-heading text-lg font-bold text-slate-700 mb-1">{hasFilters ? 'Tidak ada projek yang cocok' : 'Belum ada projek dipublikasikan'}</h3>
            <p className="text-slate-500 text-xs">
              {hasFilters ? 'Coba kata kunci lain atau lihat semua projek.' : 'Karya yang sudah diterbitkan akan tampil di sini. Silakan kunjungi kembali nanti.'}
            </p>
          </div>
        )}
        {catalogStatus === 'ready' && remainingCount > 0 && (
          <div className="mt-8 text-center">
            <button type="button" onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
              className="min-h-11 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
              Tampilkan {Math.min(PAGE_SIZE, remainingCount)} projek berikutnya ({remainingCount} tersisa)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
