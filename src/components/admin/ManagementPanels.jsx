import ValidatedForm from '../common/ValidatedForm';
import StudentEnrollment from './StudentEnrollment';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Check,
  Eye,
  Pencil,
  Plus,
  Power,
  Trash2,
  UserCheck,
  X
} from 'lucide-react';
import DataTable from '../common/DataTable';
import ConfirmDialog from '../common/ConfirmDialog';
import ModalShell from '../common/ModalShell';
import { DialogClose } from '../ui/dialog';
import { courseLabel } from '../../utils/courseLabel';

const MAX_BULK_SELECTION = 100;

function SelectionCheckbox({ checked, disabled, onChange, itemLabel }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={`${checked ? 'Batalkan pilihan' : 'Pilih'} ${itemLabel}`}
      data-selection-control
      data-select-label={`Pilih ${itemLabel}`}
      data-deselect-label={`Batalkan pilihan ${itemLabel}`}
      disabled={disabled}
      onClick={onChange}
      className="selection-checkbox inline-flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Check size={16} strokeWidth={3} aria-hidden="true" />
    </button>
  );
}

function BulkSelectionBar({ items, selectedIds, setSelectedIds, isDeleting, onDelete, noun, deleteNote }) {
  const itemIds = items.map((item) => item.id);
  const selectableIds = itemIds.slice(0, MAX_BULK_SELECTION);
  const allSelectableSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedIds(allSelectableSelected ? new Set() : new Set(selectableIds))}
          disabled={isDeleting || itemIds.length === 0}
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
        >
          {allSelectableSelected ? 'Batalkan semua' : `Pilih semua${itemIds.length > MAX_BULK_SELECTION ? ` (maks. ${MAX_BULK_SELECTION})` : ''}`}
        </button>
        <span className="text-xs font-semibold tabular-nums text-slate-600" aria-live="polite">{selectedIds.size} {noun} dipilih</span>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting || selectedIds.size === 0}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
        title={deleteNote}
      >
        <Trash2 size={15} /> {isDeleting ? 'Menghapus...' : `Hapus terpilih (${selectedIds.size})`}
      </button>
    </div>
  );
}

// ============================================================================
// 1. PROJECTS PANEL (WITH DATATABLE)
// ============================================================================
export function ProjectsPanel({ projects, searchQuery = '', onEdit, onDelete, onDeleteMany, onView }) {
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredProjects = useMemo(() => {
    if (semesterFilter === 'ALL') return projects;
    return projects.filter((p) => String(p.semester) === String(semesterFilter));
  }, [projects, semesterFilter]);

  useEffect(() => {
    const availableIds = new Set(projects.map((project) => project.id));
    setSelectedIds((previous) => new Set([...previous].filter((id) => availableIds.has(id))));
  }, [projects]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [semesterFilter, searchQuery]);

  const toggleProject = (projectId) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(projectId)) next.delete(projectId);
      else if (next.size < MAX_BULK_SELECTION) next.add(projectId);
      return next;
    });
  };

  const deleteSelectedProjects = async () => {
    if (selectedIds.size === 0 || isDeleting) return;
    setDeleteTarget({ kind: 'bulk', count: selectedIds.size });
  };

  const confirmProjectDeletion = async () => {
    if (!deleteTarget || isDeleting) return false;
    setIsDeleting(true);
    try {
      const deleted = deleteTarget.kind === 'bulk'
        ? await onDeleteMany([...selectedIds])
        : await onDelete(deleteTarget.item.id);
      if (deleted !== false) {
        if (deleteTarget.kind === 'bulk') setSelectedIds(new Set());
        setDeleteTarget(null);
        return true;
      }
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'selection',
      label: 'Pilih',
      sortable: false,
      searchable: false,
      exportable: false,
      headerClassName: 'text-center',
      className: 'text-center',
      weight: 0.6,
      render: (row) => (
        <div className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-slate-100">
          <SelectionCheckbox
            checked={selectedIds.has(row.id)}
            disabled={isDeleting || (!selectedIds.has(row.id) && selectedIds.size >= MAX_BULK_SELECTION)}
            onChange={() => toggleProject(row.id)}
            itemLabel={`projek ${row.title}`}
          />
        </div>
      )
    },
    {
      key: 'title',
      label: 'Projek & Video',
      searchValue: row => `${row.title} ${row.course} ${(row.techStack || []).join(' ')}`,
      sortable: true,
      render: (row) => (
        <div className="max-w-md">
          <strong className="block text-slate-900 font-bold leading-snug ">
            {row.title}
          </strong>
          <span className="mt-0.5 block  text-xs text-slate-600">
            {courseLabel(row.course)}
          </span>
          {row.techStack && row.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {row.techStack.slice(0, 3).map((t, idx) => (
                <span
                  key={idx}
                  className="rounded bg-slate-100 px-1.5 py-0.5 text-xs tabular-nums text-slate-600"
                >
                  {t}
                </span>
              ))}
              {row.techStack.length > 3 && (
                <span className="text-xs text-slate-600">+{row.techStack.length - 3}</span>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'student',
      label: 'Mahasiswa',
      searchValue: row => `${row.student} ${row.nim}`,
      sortable: true,
      render: (row) => (
        <div>
          <span className="block font-bold text-slate-800">{row.student}</span>
          <span className="text-xs font-medium text-slate-600">NIM. {row.nim}</span>
        </div>
      )
    },
    {
      key: 'semester',
      label: 'Sem',
      sortable: true,
      headerClassName: 'text-center',
      className: 'text-center',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-bold tabular-nums text-xs border border-sky-100">
          Sem {row.semester}
        </span>
      )
    },
    {
      key: 'year',
      label: 'Tahun',
      sortable: true,
      render: (row) => (
        <span className="text-xs tabular-nums text-slate-600">
          {row.year || '—'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      searchable: false,
      headerClassName: 'text-center',
      className: 'text-center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => onView(row)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-sky-50 p-2.5 text-sky-700 shadow-2xs transition-colors hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            title="Lihat Detail Projek"
            aria-label={`Lihat detail projek ${row.title}`}
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(row)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-amber-50 p-2.5 text-amber-700 shadow-2xs transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
            title="Edit Data Projek"
            aria-label={`Edit data projek ${row.title}`}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget({ kind: 'single', item: row })}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-rose-50 p-2.5 text-rose-700 shadow-2xs transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
            title="Hapus Projek"
            aria-label={`Hapus projek ${row.title}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const semesterFilterButtons = (
    <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
      <button
        onClick={() => setSemesterFilter('ALL')}
        aria-pressed={semesterFilter === 'ALL'}
        className={`min-h-11 whitespace-nowrap px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
          semesterFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        Semua Sem
      </button>
      {[1, 2, 3, 4, 5, 6].map((sem) => (
        <button
          key={sem}
          onClick={() => setSemesterFilter(String(sem))}
          aria-pressed={semesterFilter === String(sem)}
          className={`min-h-11 whitespace-nowrap px-2 py-1 rounded-lg font-bold text-xs transition-colors ${
            semesterFilter === String(sem)
              ? 'bg-sky-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          Sem {sem}
        </button>
      ))}
    </div>
  );

  const projectTableActions = (
    <div className="space-y-2">
      {semesterFilterButtons}
      <BulkSelectionBar
        items={filteredProjects}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        isDeleting={isDeleting}
        onDelete={deleteSelectedProjects}
        noun="projek"
        deleteNote="Hapus seluruh projek yang dipilih"
      />
    </div>
  );

  return (
    <>
    <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="font-heading font-bold text-base text-slate-900">
            Manajemen Seluruh Projek ({projects.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cari, sortir kolom, dan kelola projek yang aktif terpublikasi di showcase.
          </p>
        </div>
      </div>

      <DataTable
        data={filteredProjects}
        searchTerm={searchQuery}
        columns={columns}
        selectionState={selectedIds}
        isRowSelected={(row) => selectedIds.has(row.id)}
        isRowSelectionDisabled={(row) => isDeleting || (!selectedIds.has(row.id) && selectedIds.size >= MAX_BULK_SELECTION)}
        searchPlaceholder="Cari judul projek, nama mahasiswa, NIM, atau mata kuliah..."
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        defaultSortKey="title"
        defaultSortDirection="asc"
        extraHeaderActions={projectTableActions}
        showExportCsv={true}
        exportFileName="data-projek-mahasiswa-trk.csv"
        emptyMessage="Tidak ada projek yang cocok dengan filter saat ini."
      />
    </section>
    <ConfirmDialog
      isOpen={Boolean(deleteTarget)}
      onClose={() => { if (!isDeleting) setDeleteTarget(null); }}
      onConfirm={confirmProjectDeletion}
      title={deleteTarget?.kind === 'bulk' ? `Hapus ${deleteTarget.count} projek?` : 'Hapus projek?'}
      description={deleteTarget?.kind === 'bulk'
        ? 'Seluruh projek yang dipilih akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.'
        : `Projek “${deleteTarget?.item?.title || ''}” akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
      confirmLabel={deleteTarget?.kind === 'bulk' ? `Hapus ${deleteTarget.count} projek` : 'Hapus projek'}
    />
    </>
  );
}

// ============================================================================
// 2. STUDENTS PANEL (WITH DATATABLE)
// ============================================================================
export function StudentsPanel({ students, onViewProjects, onUpdate, onDelete, onDeleteMany }) {
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const availableIds = new Set(students.map((student) => student.id));
    setSelectedIds((previous) => new Set([...previous].filter((id) => availableIds.has(id))));
  }, [students]);

  const toggleStudent = (studentId) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(studentId)) next.delete(studentId);
      else if (next.size < MAX_BULK_SELECTION) next.add(studentId);
      return next;
    });
  };

  const deleteSelectedStudents = async () => {
    if (selectedIds.size === 0 || isDeleting) return;
    setDeleteTarget({ kind: 'bulk', count: selectedIds.size });
  };

  const confirmStudentDeletion = async () => {
    if (!deleteTarget || isDeleting) return false;
    setIsDeleting(true);
    try {
      const deleted = deleteTarget.kind === 'bulk'
        ? await onDeleteMany([...selectedIds])
        : await onDelete(deleteTarget.item.id);
      if (deleted !== false) {
        if (deleteTarget.kind === 'bulk') setSelectedIds(new Set());
        setDeleteTarget(null);
        return true;
      }
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditor = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      nim: student.nim || '',
      email: student.email || '',
      semester: student.semester || 1,
      angkatan: student.angkatan || ''
    });
    setFormError('');
  };

  const closeEditor = () => {
    if (!isSubmitting) {
      setEditingStudent(null);
      setFormData(null);
      setFormError('');
    }
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    if (!editingStudent || isSubmitting) return;
    setIsSubmitting(true);
    setFormError('');
    try {
      const updated = await onUpdate(editingStudent.id, formData);
      if (updated) {
        setEditingStudent(null);
        setFormData(null);
        setFormError('');
      }
    } catch (error) {
      setFormError(error.message || 'Data mahasiswa belum dapat diperbarui.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'selection',
      label: 'Pilih',
      sortable: false,
      searchable: false,
      exportable: false,
      headerClassName: 'text-center',
      className: 'text-center',
      weight: 0.6,
      render: (row) => (
        <div className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-slate-100">
          <SelectionCheckbox
            checked={selectedIds.has(row.id)}
            disabled={isDeleting || (!selectedIds.has(row.id) && selectedIds.size >= MAX_BULK_SELECTION)}
            onChange={() => toggleStudent(row.id)}
            itemLabel={`akun mahasiswa ${row.name}`}
          />
        </div>
      )
    },
    {
      key: 'nim',
      label: 'NIM Mahasiswa',
      sortable: true,
      render: (row) => (
        <span className="rounded-md bg-slate-100 px-2 py-1 tabular-nums text-xs font-bold text-slate-900">
          {row.nim}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Nama Lengkap',
      sortable: true,
      render: (row) => (
        <div>
          <strong className="block text-slate-900 font-bold">{row.name}</strong>
          <span className="text-xs text-slate-600">Mahasiswa TRK SV IPB</span>
        </div>
      )
    },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'angkatan', label: 'Angkatan', sortable: true },
    {
      key: 'semester',
      label: 'Semester',
      sortable: true,
      headerClassName: 'text-center',
      className: 'text-center',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 tabular-nums font-bold text-xs">
          Semester {row.semester || '-'}
        </span>
      )
    },
    {
      key: 'projectCount',
      label: 'Jumlah Projek',
      sortable: true,
      headerClassName: 'text-center',
      className: 'text-center',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold text-xs border border-sky-100">
          {row.projectCount} Projek
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      searchable: false,
      headerClassName: 'text-center',
      className: 'text-center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => onViewProjects(row.nim)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-slate-900 p-2.5 text-white shadow-2xs transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            title="Lihat projek mahasiswa"
            aria-label={`Lihat seluruh projek karya ${row.name}`}
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            onClick={() => openEditor(row)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-amber-50 p-2.5 text-amber-700 shadow-2xs transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
            title="Edit akun mahasiswa"
            aria-label={`Edit akun mahasiswa ${row.name}`}
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget({ kind: 'single', item: row })}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-rose-50 p-2.5 text-rose-700 shadow-2xs transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
            title="Hapus akun mahasiswa"
            aria-label={`Hapus akun mahasiswa ${row.name}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
  ];

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="font-heading font-bold text-base text-slate-900">
            Direktori Mahasiswa TRK ({students.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Akun mahasiswa terdaftar, termasuk yang belum mengunggah projek.
          </p>
        </div>
        <StudentEnrollment />
      </div>

      <DataTable
        data={students}
        columns={columns}
        selectionState={selectedIds}
        isRowSelected={(row) => selectedIds.has(row.id)}
        isRowSelectionDisabled={(row) => isDeleting || (!selectedIds.has(row.id) && selectedIds.size >= MAX_BULK_SELECTION)}
        extraHeaderActions={(
          <BulkSelectionBar
            items={students}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            isDeleting={isDeleting}
            onDelete={deleteSelectedStudents}
            noun="akun"
            deleteNote="Hapus seluruh akun mahasiswa yang dipilih; projek tetap dipertahankan"
          />
        )}
        searchPlaceholder="Cari mahasiswa berdasarkan nama atau NIM..."
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        defaultSortKey="name"
        defaultSortDirection="asc"
        showExportCsv={true}
        exportFileName="direktori-mahasiswa-trk.csv"
        emptyMessage="Mahasiswa tidak ditemukan."
      />

      <ModalShell isOpen={Boolean(editingStudent)} onClose={closeEditor} ariaLabel="Edit akun mahasiswa" panelClassName="max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl">
        <DialogClose disabled={isSubmitting} aria-label="Tutup form edit mahasiswa" className="absolute right-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-slate-100">
          <X size={18} />
        </DialogClose>
        <div className="p-6 sm:p-8">
          <div className="mb-6 pr-10">
            <h2 className="font-heading text-lg font-bold text-slate-900">Edit akun mahasiswa</h2>
            <p className="mt-1 text-sm text-slate-600">Perbarui identitas dan informasi akademik akun mahasiswa.</p>
          </div>
          {formData && (
            <ValidatedForm onSubmit={submitEdit} className="space-y-4">
              {[
                ['name', 'Nama lengkap', 'text'],
                ['nim', 'NIM', 'text'],
                ['email', 'Email', 'email'],
                ['semester', 'Semester', 'number'],
                ['angkatan', 'Angkatan', 'text']
              ].map(([key, label, type]) => (
                <label key={key} htmlFor={`edit-student-${key}`} className="block text-sm font-semibold text-slate-700">
                  {label}
                  <input
                    id={`edit-student-${key}`}
                    type={type}
                    min={type === 'number' ? 1 : undefined}
                    max={type === 'number' ? 14 : undefined}
                    required
                    value={formData[key]}
                    onChange={(event) => setFormData(previous => ({ ...previous, [key]: event.target.value }))}
                    className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </label>
              ))}
              {formError && <p role="alert" className="text-sm font-semibold text-rose-700">{formError}</p>}
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeEditor} disabled={isSubmitting} className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50">Batal</button>
                <button type="submit" disabled={isSubmitting} className="min-h-11 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60">{isSubmitting ? 'Menyimpan...' : 'Simpan perubahan'}</button>
              </div>
            </ValidatedForm>
          )}
        </div>
      </ModalShell>
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => { if (!isDeleting) setDeleteTarget(null); }}
        onConfirm={confirmStudentDeletion}
        title={deleteTarget?.kind === 'bulk' ? `Hapus ${deleteTarget.count} akun mahasiswa?` : 'Hapus akun mahasiswa?'}
        description={deleteTarget?.kind === 'bulk'
          ? 'Akun mahasiswa yang dipilih akan dihapus, tetapi seluruh projek mereka tetap dipertahankan.'
          : `Akun ${deleteTarget?.item?.name || 'mahasiswa'} akan dihapus, tetapi seluruh projeknya tetap dipertahankan.`}
        confirmLabel={deleteTarget?.kind === 'bulk' ? `Hapus ${deleteTarget.count} akun` : 'Hapus akun'}
      />
    </section>
  );
}

// ============================================================================
// 3. MODERATORS PANEL (WITH DATATABLE)
// ============================================================================
export function ModeratorsPanel({ moderators, onAdd, onToggle, onDelete }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', nip: '', email: '', role: 'admin' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    const normalized = {
      name: formData.name.trim(),
      nip: formData.nip.trim(),
      email: formData.email.trim().toLocaleLowerCase('id-ID'),
      role: formData.role
    };
    if (normalized.name.length < 3) {
      setFormError('Nama moderator minimal 3 karakter.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
      setFormError('Masukkan alamat email moderator yang valid.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      const added = await onAdd(normalized);
      if (added) { setFormData({ name: '', nip: '', email: '', role: 'admin' }); setIsAddOpen(false); }
      else setFormError('Moderator belum ditambahkan. Periksa data atau coba kembali.');
    } catch (error) {
      setFormError(error.message || 'Moderator gagal ditambahkan. Silakan coba kembali.');
    } finally { setIsSubmitting(false); }
  };

  const columns = [
    {
      key: 'name',
      label: 'Nama',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
            <UserCheck size={16} />
          </div>
          <div>
            <strong className="text-slate-900 font-bold block">{row.name}</strong>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums text-xs text-slate-600">{row.email}</span>
      )
    },
    { key: 'role', label: 'Role', sortable: true, render: row => row.role === 'lecturer' ? 'Dosen' : row.role === 'admin' ? 'Admin' : 'Belum ditentukan' },
    { key: 'nip', label: 'NIP', sortable: true, render: row => row.nip || '—' },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${
            row.status === 'active'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {row.status === 'active' ? 'Aktif' : 'Nonaktif'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      searchable: false,
      headerClassName: 'text-center',
      className: 'text-center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => onToggle(row.id)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-amber-50 p-2.5 text-amber-700 shadow-2xs transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
            title="Ubah status akses"
            aria-label={`Ubah status akses moderator ${row.name}`}
          >
            <Power size={16} />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-rose-50 p-2.5 text-rose-700 shadow-2xs transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
            title="Hapus moderator"
            aria-label={`Hapus moderator ${row.name}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-w-0 space-y-4">
      <ModalShell isOpen={isAddOpen} onClose={() => { if (!isSubmitting) setIsAddOpen(false); }} ariaLabel="Tambah moderator" panelClassName="max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl">
      <DialogClose disabled={isSubmitting} aria-label="Tutup form moderator" className="absolute right-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-slate-100"><X size={18} /></DialogClose>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs" noValidate>
        <div>
          <h2 className="font-heading font-bold text-base text-slate-900 pr-12">Tambah Moderator</h2>
          <p className="text-xs text-slate-500 mt-1">Daftarkan dosen pembimbing atau admin baru.</p>
        </div>
        {[
          ['name', 'Nama lengkap', 'Nama dosen / admin'],
          ['nip', 'NIP', 'Nomor induk pegawai'],
          ['email', 'Email', 'nama@apps.ipb.ac.id']
        ].map(([name, label, placeholder]) => (
          <label key={name} className="block text-xs font-bold text-slate-700">
            {label}{name !== 'nip' && ' *'}
            <input
              id={`moderator-${name}`}
              type={name === 'email' ? 'email' : 'text'}
              disabled={isSubmitting}
              maxLength={name === 'name' ? 120 : name === 'nip' ? 40 : 160}
              value={formData[name]}
              onChange={(event) => {
                setFormData((previous) => ({ ...previous, [name]: event.target.value }));
                setFormError('');
              }}
              placeholder={placeholder}
              required={name !== 'nip'}
              autoComplete={name === 'email' ? 'email' : 'off'}
              aria-describedby={formError ? 'moderator-form-error' : undefined}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-base focus:outline-none focus:ring-2 focus:ring-sky-500/20 sm:text-xs"
            />
          </label>
        ))}
        <fieldset disabled={isSubmitting}>
          <legend className="text-xs font-bold text-slate-700">Role *</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1.5">
            {[['admin', 'Admin'], ['lecturer', 'Dosen']].map(([value, label]) => (
              <label key={value} className="min-w-0 cursor-pointer">
                <input type="radio" name="moderator-role" value={value} checked={formData.role === value} onChange={() => setFormData(previous => ({ ...previous, role: value }))} className="peer sr-only" />
                <span className="flex min-h-11 items-center justify-center rounded-lg border border-transparent px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-white/60 peer-checked:border-slate-200 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow-sm peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-600 peer-disabled:cursor-wait peer-disabled:opacity-50">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {formError && <p id="moderator-form-error" role="alert" className="text-xs font-semibold text-rose-700">{formError}</p>}
        <button disabled={isSubmitting} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60">
          <Plus size={15} /> {isSubmitting ? 'Menambahkan...' : 'Tambah Moderator'}
        </button>
      </form>
      </ModalShell>

      {/* DataTable List */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
          <h2 className="font-heading font-bold text-base text-slate-900">
            Daftar Moderator ({moderators.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola hak akses moderasi dan manajemen sistem showcase.
          </p>
          </div>
          <button type="button" onClick={() => { setFormData({ name: '', nip: '', email: '', role: 'admin' }); setFormError(''); setIsAddOpen(true); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"><Plus size={16} /> Tambah Moderator</button>
        </div>

        <DataTable
          data={moderators}
          columns={columns}
          searchPlaceholder="Cari moderator atau NIP..."
          defaultPageSize={10}
          pageSizeOptions={[5, 10, 25]}
          defaultSortKey="name"
          defaultSortDirection="asc"
          showExportCsv={true}
          exportFileName="data-moderator-trk.csv"
          emptyMessage="Moderator tidak ditemukan."
        />
      </section>
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => onDelete(deleteTarget.id)}
        title="Hapus moderator?"
        description={`Akses moderator ${deleteTarget?.name || ''} akan dicabut permanen.`}
        confirmLabel="Hapus moderator"
      />
    </div>
  );
}

// ============================================================================
// 4. TAXONOMY PANEL (COURSES & CATEGORIES WITH DATATABLE)
// ============================================================================
export function TaxonomyPanel({ title, description, items, getCount, onAdd, onDelete }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFormError('');
    try {
      const added = await onAdd(name.trim());
      if (added) { setName(''); setIsAddOpen(false); }
      else setFormError('Data belum ditambahkan. Periksa nama atau coba kembali.');
    } catch (error) {
      setFormError(error.message || 'Data gagal ditambahkan. Silakan coba kembali.');
    } finally { setIsSubmitting(false); }
  };

  // Normalize items to objects if they are strings
  const normalizedData = useMemo(() => {
    return items.map((item, idx) => {
      if (typeof item === 'string') {
        const count = getCount ? getCount(item) : 0;
        return { id: idx, name: item, projectCount: count };
      }
      return {
        id: item.id || idx,
        name: item.name,
        projectCount: getCount ? getCount(item.name) : (item.projectCount || 0)
      };
    });
  }, [items, getCount]);

  const columns = [
    {
      key: 'name',
      label: `Nama ${title}`,
      sortable: true,
      render: (row) => (
        <div>
          <strong className="block text-slate-900 font-bold text-xs">{row.name}</strong>
        </div>
      )
    },
    {
      key: 'projectCount',
      label: 'Projek Terkait',
      sortable: true,
      headerClassName: 'text-center',
      className: 'text-center',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs tabular-nums">
          {row.projectCount || 0} Projek
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      searchable: false,
      headerClassName: 'text-center',
      className: 'text-center',
      render: (row) => (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              if (row.projectCount > 0) {
                setFormError(`Tidak dapat menghapus “${row.name}” karena masih digunakan oleh ${row.projectCount} projek.`);
                return;
              }
              setDeleteTarget(row);
            }}
            disabled={row.projectCount > 0}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
              row.projectCount > 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-2xs'
            }`}
            title={row.projectCount > 0 ? 'Masih digunakan oleh projek' : 'Hapus item'}
            aria-label={`Hapus ${title.toLowerCase()} ${row.name}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-w-0 space-y-4">
      <ModalShell isOpen={isAddOpen} onClose={() => { if (!isSubmitting) setIsAddOpen(false); }} ariaLabel={`Tambah ${title.toLowerCase()}`} panelClassName="max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl">
      <DialogClose disabled={isSubmitting} aria-label={`Tutup form ${title.toLowerCase()}`} className="absolute right-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-slate-100"><X size={18} /></DialogClose>
      <ValidatedForm onSubmit={submit} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="font-heading font-bold text-base text-slate-900 pr-12">Tambah {title}</h2>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        <label className="block text-xs font-bold text-slate-700">
          Nama {title} *
          <input
            disabled={isSubmitting}
            minLength={3}
            maxLength={160}
            value={name}
            onChange={(event) => { setName(event.target.value); setFormError(''); }}
            placeholder={`Masukkan nama ${title.toLowerCase()}...`}
            required
            className="mt-1.5 min-h-11 w-full px-3.5 py-2 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </label>
        {formError && <p role="alert" className="text-sm text-rose-700">{formError}</p>}
        <button disabled={isSubmitting} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-2xs transition-all disabled:cursor-wait disabled:opacity-60">
          <Plus size={15} /> {isSubmitting ? 'Menambahkan...' : `Tambah ${title}`}
        </button>
      </ValidatedForm>
      </ModalShell>

      {/* DataTable List */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
          <h2 className="font-heading font-bold text-base text-slate-900">
            Daftar {title} ({normalizedData.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Item yang sedang terikat dengan projek tidak dapat dihapus demi integritas data.
          </p>
          </div>
          <button type="button" onClick={() => { setName(''); setFormError(''); setIsAddOpen(true); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"><Plus size={16} /> Tambah {title}</button>
        </div>

        <DataTable
          data={normalizedData}
          columns={columns}
          searchPlaceholder={`Cari ${title.toLowerCase()}...`}
          defaultPageSize={10}
          pageSizeOptions={[5, 10, 25]}
          defaultSortKey="name"
          defaultSortDirection="asc"
          showExportCsv={true}
          exportFileName={`data-${title.toLowerCase().replace(/\s+/g, '-')}.csv`}
          emptyMessage={`${title} tidak ditemukan.`}
        />
      </section>
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => onDelete(deleteTarget.name)}
        title={`Hapus ${title.toLowerCase()}?`}
        description={`“${deleteTarget?.name || ''}” akan dihapus permanen dari daftar ${title.toLowerCase()}.`}
        confirmLabel={`Hapus ${title.toLowerCase()}`}
      />
    </div>
  );
}
