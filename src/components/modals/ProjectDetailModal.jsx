import React from 'react';
import { X, User, Clock, Video } from 'lucide-react';
import ModalShell from '../common/ModalShell';
import { DialogClose } from '../ui/dialog';
import { getYouTubeEmbedUrl } from '../../data/projectsData';
import { courseLabel } from '../../utils/courseLabel';
import './ProjectDetailModal.css';

export default function ProjectDetailModal({ project, onClose }) {
  if (!project) return null;
  const embedUrl = getYouTubeEmbedUrl(project.videoUrl);
  const facts = [
    ['Mata kuliah', courseLabel(project.course)],
    ['Dosen pembimbing', project.supervisor],
    ['Semester', project.semester],
    ['Tahun akademik', project.year],
    ['Tanggal projek', project.date]
  ];
  return (
    <ModalShell onClose={onClose} ariaLabel={`Detail projek ${project.title}`} panelClassName="project-detail-modal">
      <header className="project-detail-header">
        <div>
          <h2>{project.title}</h2>
          <p className="project-detail-author"><User size={16} aria-hidden="true" /><span>{project.student}{project.nim && <span className="project-detail-nim"> · NIM {project.nim}</span>}</span></p>
        </div>
        <DialogClose type="button" className="project-detail-close" aria-label="Tutup detail projek" title="Tutup detail projek"><X size={20} aria-hidden="true" /></DialogClose>
      </header>
      <div className="project-detail-scroll">
        {project.status === 'pending' && (
          <div className="project-detail-status" role="status">
            <Clock size={18} aria-hidden="true" />
            <div><strong>Menunggu persetujuan</strong><p>Projek sedang ditinjau. Pratinjau ini hanya dapat dilihat oleh Anda dan pengelola hingga disetujui untuk dipublikasikan.</p></div>
          </div>
        )}
        <div className="project-detail-layout">
          <div className="project-detail-main">
            <div className="project-detail-video">
              {embedUrl ? <iframe src={embedUrl} title={`Video projek ${project.title}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <div className="project-detail-video-empty"><Video size={28} aria-hidden="true" /><p>Video belum tersedia</p></div>}
            </div>
            <section className="project-detail-description" aria-label="Deskripsi projek">
              <h3>Tentang projek</h3>
              <p>{project.description || project.desc || 'Deskripsi projek belum dicantumkan.'}</p>
            </section>
          </div>
          <aside className="project-detail-info" aria-label="Informasi projek">
            <section>
              <h3>Informasi akademik</h3>
              <dl className="project-detail-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Belum dicantumkan'}</dd></div>)}</dl>
            </section>
            {project.techStack?.length > 0 && <section className="project-detail-technologies"><h3>Teknologi yang digunakan</h3><ul>{project.techStack.map((tech, index) => <li key={`${tech}-${index}`}>{tech}</li>)}</ul></section>}
          </aside>
        </div>
      </div>
    </ModalShell>
  );
}
