import React from 'react';
import { Clock, EyeOff, Video } from 'lucide-react';
import { getYouTubeEmbedUrl } from '../../data/projectsData';
import { courseLabel } from '../../utils/courseLabel';
import { descriptionLinks } from '../../utils/descriptionLinks';

export default function ProjectDetailContent({ project, headingLevel = 3 }) {
  const Heading = `h${headingLevel}`;
  const embedUrl = getYouTubeEmbedUrl(project.videoUrl);
  const facts = [
    ['Mata kuliah', courseLabel(project.course)],
    ['Dosen pembimbing', project.supervisor],
    ['Semester', project.semester],
    ['Tahun akademik', project.year],
    ['Tanggal projek', project.date],
    ...(project.approvedBy ? [['Disetujui oleh', project.approvedBy]] : [])
  ];
  return <div className="project-detail-content">
    {project.status === 'pending' && <div className="project-detail-status" role="status">
      <Clock size={18} aria-hidden="true" />
      <div><strong>Menunggu persetujuan</strong><p>Projek sedang ditinjau. Pratinjau ini hanya dapat dilihat oleh Anda dan pengelola hingga disetujui untuk dipublikasikan.</p></div>
    </div>}
    {project.isPublished === false && <div className="project-detail-status" role="status">
      <EyeOff size={18} aria-hidden="true" />
      <div><strong>Projek tidak tayang</strong><p>Detail ini hanya dapat dilihat oleh pembuat dan admin. Tautan publik tidak dapat dibuka.</p></div>
    </div>}
    <div className="project-detail-layout">
      <div className="project-detail-main">
        <div className="project-detail-video">
          {embedUrl ? <iframe src={embedUrl} loading="lazy" title={`Video projek ${project.title}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <div className="project-detail-video-empty"><Video size={28} aria-hidden="true" /><p>Video belum tersedia</p></div>}
        </div>
        <section className="project-detail-description" aria-label="Deskripsi projek">
          <Heading>Tentang projek</Heading>
          <p>{descriptionLinks(project.description || project.desc || 'Deskripsi projek belum dicantumkan.').map((part, index) => part.href
            ? <a key={index} href={part.href} target="_blank" rel="noopener noreferrer" title="Buka tautan di tab baru">{part.text}</a>
            : <React.Fragment key={index}>{part.text}</React.Fragment>)}</p>
        </section>
      </div>
      <aside className="project-detail-info" aria-label="Informasi projek">
        <section>
          <Heading>Informasi akademik</Heading>
          <dl className="project-detail-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Belum dicantumkan'}</dd></div>)}</dl>
        </section>
        {project.techStack?.length > 0 && <section className="project-detail-technologies"><Heading>Teknologi yang digunakan</Heading><ul>{project.techStack.map((tech, index) => <li key={`${tech}-${index}`}>{tech}</li>)}</ul></section>}
      </aside>
    </div>
  </div>;
}
