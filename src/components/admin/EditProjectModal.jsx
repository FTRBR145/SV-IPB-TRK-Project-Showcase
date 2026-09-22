import ValidatedForm from '../common/ValidatedForm';
import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import useApp from '../../hooks/useApp';
import ModalShell from '../common/ModalShell';
import { DialogClose } from '../ui/dialog';
import { normalizeProjectVideo, projectContentErrors } from '../../utils/projectInput';
import { getYouTubeThumbnail } from '../../data/projectsData';

const fieldClass = 'w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-800 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600';

export default function EditProjectModal({
  project,
  onClose,
  onSave,
  title = 'Edit Projek',
  description = 'Perbarui informasi projek yang sudah dipublikasikan.',
  submitLabel = 'Simpan Perubahan'
}) {
  const { courses, updateProject } = useApp();
  const [formData, setFormData] = useState({
    title: project.title,
    course: project.course,
    semester: project.semester,
    supervisor: project.supervisor || '',
    videoUrl: project.videoUrl || '',
    techStackStr: project.techStack?.join(', ') || '',
    description: project.description || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState({});

  const updateField = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setErrors(previous => ({ ...previous, [name]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    const nextErrors = projectContentErrors(formData);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document.getElementById(`edit-${Object.keys(nextErrors)[0]}`)?.focus();
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    const { techStackStr, ...projectUpdates } = formData;
    const updated = await (onSave || updateProject)(project.id, {
      ...projectUpdates,
      videoUrl: normalizeProjectVideo(formData.videoUrl),
      ...(formData.videoUrl !== project.videoUrl ? { thumbnail: getYouTubeThumbnail(normalizeProjectVideo(formData.videoUrl)) } : {}),
      supervisor: formData.supervisor.trim(),
      description: formData.description.trim(),
      semester: Number.parseInt(formData.semester, 10),
      techStack: techStackStr.split(',').map((item) => item.trim()).filter(Boolean)
    });
    setIsSubmitting(false);
    if (updated) onClose();
    else setFormError('Perubahan belum tersimpan. Periksa data lalu coba kembali.');
  };

  return (
    <ModalShell onClose={onClose} ariaLabel={`Edit projek ${project.title}`} panelClassName="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
        <DialogClose
          type="button"
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          aria-label="Tutup modal edit projek"
        >
          <X size={17} />
        </DialogClose>

        <div className="mb-6 pr-8">
          <h2 className="font-heading text-xl font-extrabold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>

        <ValidatedForm onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="edit-title" className="block text-xs font-bold text-slate-700 mb-1.5">
              Judul projek *
            </label>
            <input
              id="edit-title"
              name="title"
              value={formData.title}
              onChange={updateField}
              className={fieldClass}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="edit-course" className="block text-xs font-bold text-slate-700 mb-1.5">
                Mata kuliah *
              </label>
              <select
                id="edit-course"
                name="course"
                value={formData.course}
                onChange={updateField}
                className={fieldClass}
              >
                {courses.map((course) => <option key={course} value={course}>{course}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-semester" className="block text-xs font-bold text-slate-700 mb-1.5">
                Semester *
              </label>
              <select
                id="edit-semester"
                name="semester"
                value={formData.semester}
                onChange={updateField}
                className={fieldClass}
              >
                {[1, 2, 3, 4, 5, 6].map((semester) => (
                  <option key={semester} value={semester}>Semester {semester}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-supervisor" className="block text-xs font-bold text-slate-700 mb-1.5">
                Dosen pembimbing
              </label>
              <input
                id="edit-supervisor"
                name="supervisor"
                value={formData.supervisor}
                onChange={updateField}
                className={fieldClass}
                placeholder="Nama dosen pembimbing"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-videoUrl" className="block text-xs font-bold text-slate-700 mb-1.5">
              URL video YouTube *
            </label>
            <input
              id="edit-videoUrl"
              type="url"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={updateField}
              className={fieldClass}
              placeholder="https://www.youtube.com/watch?v=..."
              required
              aria-invalid={Boolean(errors.videoUrl)}
              aria-describedby={errors.videoUrl ? 'edit-videoUrl-error' : undefined}
            />
            {errors.videoUrl && <p id="edit-videoUrl-error" className="mt-1.5 text-xs text-rose-700">{errors.videoUrl}</p>}
          </div>

          <div>
            <label htmlFor="edit-techStack" className="block text-xs font-bold text-slate-700 mb-1.5">
              Teknologi / Tech stack
            </label>
            <input
              id="edit-techStack"
              name="techStackStr"
              value={formData.techStackStr}
              onChange={updateField}
              className={fieldClass}
              placeholder="Pisahkan dengan koma, misal: ESP32, Arduino, C++"
            />
          </div>

          <div>
            <label htmlFor="edit-description" className="block text-xs font-bold text-slate-700 mb-1.5">
              Deskripsi Projek *
            </label>
            <textarea
              id="edit-description"
              name="description"
              rows={4}
              required
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'edit-description-error' : undefined}
              value={formData.description}
              onChange={updateField}
              className="w-full min-h-[96px] px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-800 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 resize-none"
            />
            {errors.description && <p id="edit-description-error" className="mt-1.5 text-xs text-rose-700">{errors.description}</p>}
          </div>

          {formError && (
            <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-800" role="alert">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <DialogClose
              type="button"
              disabled={isSubmitting}
              className="min-h-11 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-50"
            >
              Batal
            </DialogClose>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              <Save size={16} /> {isSubmitting ? 'Menyimpan...' : submitLabel}
            </button>
          </div>
        </ValidatedForm>
    </ModalShell>
  );
}
