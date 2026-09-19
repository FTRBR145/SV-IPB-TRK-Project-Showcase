import React from 'react';

export default function AboutSection() {

  return (
    <section id="about" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2
              className="font-heading text-2xl sm:text-3xl font-semibold text-slate-800 mb-4 leading-tight"
            >
              TRK Student Project Showcase
            </h2>
            <p
              className="text-slate-600 text-sm sm:text-base leading-relaxed"
            >
              Ruang digital bagi mahasiswa Teknologi Rekayasa Komputer (TRK) Sekolah Vokasi IPB University untuk mempublikasikan berbagai produk hasil pembelajaran mata kuliah dan proyek akhir. Tempat mengeksplorasi karya praktikum dan proyek akhir mahasiswa TRK secara interaktif.
            </p>
          </div>
          <div
            className="overflow-hidden rounded-xl"
          >
            <picture>
              <source media="(max-width: 767px)" srcSet="/trk_photos/optimized/DSC09046-640.webp" type="image/webp" />
              <source srcSet="/trk_photos/optimized/DSC09046-1600.webp" type="image/webp" />
              <img
                src="/trk_photos/optimized/DSC09046-1600.webp"
                alt="Mahasiswa TRK Sekolah Vokasi IPB University"
                loading="lazy"
                decoding="async"
                width="1600"
                height="1067"
                className="w-full h-64 sm:h-80 object-cover"
              />
            </picture>
            <div className="pt-3 text-slate-600">
              <span className="text-sm">
                Praktikum & Projek Akhir TRK
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
