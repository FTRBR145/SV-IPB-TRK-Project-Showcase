import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MataKuliahSection({ onSelectCourse }) {
  const scrollRef = useRef(null);

  const baseCourses = [
    {
      name: "Rangkaian Logika & Teknik Digital",
      courseFullName: "RANGKAIAN LOGIKA DAN TEKNIK DIGITAL",
      image: "/trk_photos/optimized/DSC09040-640.webp"
    },
    {
      name: "Teknologi Bengkel Elektromekanik",
      courseFullName: "TEKNOLOGI BENGKEL ELEKTROMEKANIK",
      image: "/trk_photos/optimized/DSC09042-640.webp"
    },
    {
      name: "Aplikasi Mobile",
      courseFullName: "APLIKASI MOBILE",
      image: "/trk_photos/optimized/DSC09048-640.webp"
    },
    {
      name: "Sistem Tertanam",
      courseFullName: "SISTEM TERTANAM (EMBEDDED SYSTEM)",
      image: "/trk_photos/optimized/DSC09038-640.webp"
    },
    {
      name: "Proyek Sistem IoT",
      courseFullName: "PROYEK SISTEM IOT (INTERNET OF THINGS)",
      image: "/trk_photos/optimized/DSC09044-640.webp"
    }
  ];

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const scrollAmount = Math.min(320, clientWidth * 0.85);
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

      if (direction === 'right') {
        if (scrollLeft + clientWidth >= scrollWidth - 25) {
          scrollRef.current.scrollTo({ left: 0, behavior });
        } else {
          scrollRef.current.scrollBy({ left: scrollAmount, behavior });
        }
      } else {
        if (scrollLeft <= 25) {
          scrollRef.current.scrollTo({ left: scrollWidth - clientWidth, behavior });
        } else {
          scrollRef.current.scrollBy({ left: -scrollAmount, behavior });
        }
      }
    }
  };

  return (
    <section id="matakuliah" className="py-12 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2

          className="font-heading text-2xl sm:text-3xl font-semibold text-slate-800 mb-8"
        >
          Mata Kuliah berbasis Project
        </h2>

        <div className="relative group/slider">
          <button
            className="absolute left-0 top-1/2 z-20 flex h-11 w-11  -translate-y-1/2 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700  transition-colors hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 "
            onClick={() => handleScroll('left')}
            aria-label="Geser mata kuliah ke kiri"
          >
            <ChevronLeft size={20} />
          </button>

          <div
            className="flex gap-4 overflow-x-auto pb-4 focus-visible:rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            ref={scrollRef}
            tabIndex={0}
            role="region"
            aria-label="Daftar mata kuliah berbasis project"
          >
            {baseCourses.map((c) => (
              <button
                type="button"
                key={c.courseFullName}
                className="group w-[min(16rem,calc(100vw-3.5rem))] flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition-colors hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 sm:w-72"
                onClick={() => {
                  if (onSelectCourse) onSelectCourse(c.courseFullName);
                  const el = document.getElementById('projects');
                  if (el) {
                    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
                    el.scrollIntoView({ behavior });
                  }
                }}
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    decoding="async"
                    width="640"
                    height="426"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 min-h-20 text-slate-900 font-semibold text-sm">
                  <span>{c.name}</span>
                </div>
              </button>
            ))}
          </div>

          <button
            className="absolute right-0 top-1/2 z-20 flex h-11 w-11  -translate-y-1/2 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-lg transition-colors hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 "
            onClick={() => handleScroll('right')}
            aria-label="Geser mata kuliah ke kanan"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
