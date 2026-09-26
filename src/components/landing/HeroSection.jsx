import React, { useEffect, useRef, useState } from 'react';
import { Upload, ArrowRight } from 'lucide-react';

export default function HeroSection({ onOpenUpload }) {
  const images = [
    { small: '/trk_photos/optimized/DSC09044-640.webp', large: '/trk_photos/optimized/DSC09044-1600.webp' },
    { small: '/trk_photos/optimized/DSC09040-640.webp', large: '/trk_photos/optimized/DSC09040-1600.webp' },
    { small: '/trk_photos/optimized/DSC09042-640.webp', large: '/trk_photos/optimized/DSC09042-1600.webp' },
    { small: '/trk_photos/optimized/DSC09046-640.webp', large: '/trk_photos/optimized/DSC09046-1600.webp' },
    { small: '/sv_ipb_hero-640.webp', large: '/sv_ipb_hero-1600.webp' }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [loadedCount, setLoadedCount] = useState(prefersReducedMotion ? 1 : 2);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(!document.hidden);
  const heroRef = useRef(null);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener?.('change', updatePreference);
    return () => mediaQuery.removeEventListener?.('change', updatePreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setIsDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    if (!heroRef.current || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setIsHeroVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !isHeroVisible || !isDocumentVisible) return undefined;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [images.length, isDocumentVisible, isHeroVisible, prefersReducedMotion]);

  useEffect(() => {
    if (!prefersReducedMotion) {
      setLoadedCount(count => Math.max(count, Math.min(images.length, currentSlide + 2)));
    }
  }, [currentSlide, images.length, prefersReducedMotion]);

  return (
    <section ref={heroRef} id="home" className="landing-hero" aria-roledescription="carousel" aria-label="Dokumentasi TRK">
      <div className="hero-slides" aria-hidden="true">
        {images.slice(0, loadedCount).map((image, index) => (
          <picture key={image.large} className={`hero-slide ${index === currentSlide ? 'is-active' : ''}`}>
            <source media="(max-width: 767px)" srcSet={image.small} type="image/webp" />
            <img src={image.large} alt="" width="1600" height="1067"
              decoding="async" fetchPriority={index === 0 ? 'high' : 'low'} />
          </picture>
        ))}
      </div>
      <div className="landing-container hero-layout">
        <div className="hero-copy">
          <h1>Teknologi Rekayasa Komputer<br />Project Showcase</h1>
          <p>Platform showcase video project mata kuliah Program Studi Teknologi Rekayasa Komputer (TRK) Sekolah Vokasi IPB University. Menampilkan berbagai produk inovasi sistem cerdas berbasis komputer modern, Internet of Things (IoT), robotik, dan kecerdasan buatan.</p>
          <div className="hero-actions">
            <a className="landing-primary" href="#projects">
              Jelajahi Projek <ArrowRight size={18} />
            </a>
            <button type="button" className="landing-secondary" onClick={onOpenUpload}>
              Unggah Projek <Upload size={18} />
            </button>
          </div>
        </div>
        <div className="hero-gallery">
          <div className="hero-caption">
            <span>{currentSlide === 4 ? 'Sekolah Vokasi IPB University' : 'Praktikum & projek akhir TRK'}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
