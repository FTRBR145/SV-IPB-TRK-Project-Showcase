import React from 'react';
import { Play } from 'lucide-react';
import { getYouTubeThumbnail } from '../../data/projectsData';
import { courseLabel } from '../../utils/courseLabel';

export default function ProjectCard({ project, onClickDetail, motionIndex = 0 }) {
  const displayThumbnail = getYouTubeThumbnail(project.videoUrl) || project.thumbnail;

  return (
    <article
      className="project-card group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
      style={{ '--motion-index': motionIndex }}
    >
      {/* Thumbnail Wrapper */}
      <button
        type="button"
        className="relative h-48 overflow-hidden bg-slate-900 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 sm:h-52"
        onClick={() => onClickDetail(project)}
        aria-label={`Lihat detail ${project.title}`}
      >
        <img
          src={displayThumbnail}
          alt={`Thumbnail projek ${project.title}`}
          width="480"
          height="270"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
        <span className="absolute top-3 left-3 bg-slate-900 text-slate-200 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-700">
          Semester {project.semester}
        </span>
        <div className="absolute bottom-3 right-3">
          <div className="project-play w-11 h-11 rounded-full bg-white text-slate-900 flex items-center justify-center">
            <Play size={22} fill="currentColor" className="ml-1" />
          </div>
        </div>
      </button>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-heading text-base font-bold text-slate-800 line-clamp-2 mb-1 group-hover:text-slate-600 transition-colors">
            {project.title}
          </h3>
          <p className="mb-3 text-xs font-medium text-slate-600">Oleh {project.student}</p>

          <span className="block text-slate-600 text-xs leading-relaxed mb-3">
            {courseLabel(project.course)}
          </span>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {(project.techStack || []).map((tech, idx) => (
              <span key={idx} className="text-xs text-slate-600">
                {tech}
                {idx < project.techStack.length - 1 && <span className="ml-1.5" aria-hidden="true">/</span>}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="min-h-11 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
          onClick={() => onClickDetail(project)}
          aria-label={`Lihat detail projek ${project.title}`}
        >
          Lihat Detail
        </button>
      </div>
    </article>
  );
}
