import React from 'react';
import { X, User } from 'lucide-react';
import ModalShell from '../common/ModalShell';
import { DialogClose } from '../ui/dialog';
import ProjectDetailContent from '../projects/ProjectDetailContent';
import './ProjectDetailModal.css';

export default function ProjectDetailModal({ project, onClose }) {
  if (!project) return null;
  return (
    <ModalShell onClose={onClose} ariaLabel={`Detail projek ${project.title}`} panelClassName="project-detail-modal">
      <header className="project-detail-header">
        <div>
          <h2>{project.title}</h2>
          <p className="project-detail-author"><User size={16} aria-hidden="true" /><span>{project.student}{project.nim && <span className="project-detail-nim"> · NIM {project.nim}</span>}</span></p>
        </div>
        <DialogClose type="button" className="project-detail-close" aria-label="Tutup detail projek" title="Tutup detail projek"><X size={20} aria-hidden="true" /></DialogClose>
      </header>
      <div className="project-detail-scroll"><ProjectDetailContent project={project} /></div>
    </ModalShell>
  );
}
