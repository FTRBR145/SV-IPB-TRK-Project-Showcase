import React, { useState } from 'react';
import { ArrowUpRight, Clock, Play, ImageOff, Pencil, EyeOff, Eye, Trash2 } from 'lucide-react';
import { getYouTubeThumbnail } from '../../data/projectsData';
import { courseLabel } from '../../utils/courseLabel';
import { isUnavailableThumbnail } from '../../utils/studentFeed';

function ProjectCover({ src, automatic, project }) {
  const [failed, setFailed] = useState(!src);
  return (
    <div className="student-cover">
      {failed ? (
        <div className="student-cover-fallback">
          <ImageOff size={24} aria-hidden="true" />
          <span>{courseLabel(project.course)}</span>
          <strong>{project.title}</strong>
          <small>Pratinjau gambar belum tersedia</small>
        </div>
      ) : (
        <img src={src} alt={`Sampul ${project.title}`} width="480" height="270" loading="lazy" decoding="async"
          onError={() => setFailed(true)}
          onLoad={event => {
            if (isUnavailableThumbnail({ automatic, width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })) setFailed(true);
          }} />
      )}
      {!failed && <span className="student-cover-play" aria-hidden="true"><Play size={16} fill="currentColor" /></span>}
    </div>
  );
}

export default function StudentProjectCard({ project, isOwner, onOpen, onEdit, onTogglePublication, onDelete, isToggling }) {
  const src = project.thumbnail || getYouTubeThumbnail(project.videoUrl);
  const pending = project.status === 'pending';
  const adminHidden = !pending && project.isPublished === false && project.publicationLockedByAdmin !== false;
  return (
    <article className="student-project">
      <button type="button" className="student-project-link" onClick={() => onOpen(project)} aria-label={`Lihat detail ${project.title}`}>
        <ProjectCover key={src} src={src} automatic={!project.thumbnail} project={project} />
        <div className="student-project-copy">
          <div className="student-project-meta"><span>Semester {project.semester}</span>
            {pending ? <span className="student-pending"><Clock size={13} aria-hidden="true" /> Menunggu persetujuan</span> : project.isPublished === false ? <span className="student-pending"><EyeOff size={13} aria-hidden="true" /> {adminHidden ? 'Disembunyikan admin' : 'Tidak tayang'}</span> : isOwner && <span>Projek saya · Tayang</span>}
          </div>
          <h2>{project.title}</h2>
          <p className="student-project-author">{project.student}</p>
          <p className="student-project-course">{courseLabel(project.course)}</p>
          {project.techStack?.length > 0 && <p className="student-project-stack">{project.techStack.slice(0, 3).join(' / ')}</p>}
          {adminHidden && isOwner && <p className="student-project-notice">
            Alasan admin: {project.publicationReason || 'Belum dicatat.'} Hanya admin yang dapat menayangkan kembali projek ini.
          </p>}
        </div>
      </button>
      <div className="student-project-actions">
        <span>{project.date || project.year}</span>
        <div>
          <button type="button" onClick={() => onOpen(project)}>Lihat projek <ArrowUpRight size={16} aria-hidden="true" /></button>
          {isOwner && onEdit && (
            <button type="button" className="student-edit-project" onClick={() => onEdit(project)}>
              <Pencil size={15} aria-hidden="true" /> {pending ? 'Edit pengajuan' : 'Edit projek'}
            </button>
          )}
          {isOwner && !pending && onTogglePublication && !adminHidden && (
            <button type="button" className="student-edit-project" disabled={isToggling} onClick={() => onTogglePublication(project)}>
              {project.isPublished === false ? <Eye size={15} aria-hidden="true" /> : <EyeOff size={15} aria-hidden="true" />}
              {project.isPublished === false ? 'Tayangkan' : 'Sembunyikan'}
            </button>
          )}
          {isOwner && onDelete && (
            <button type="button" className="student-delete-project" onClick={() => onDelete(project)}>
              <Trash2 size={15} aria-hidden="true" /> {pending ? 'Batalkan pengajuan' : 'Hapus projek'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
