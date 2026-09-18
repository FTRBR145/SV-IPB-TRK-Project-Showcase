import ValidatedForm from '../common/ValidatedForm';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Activity,
  Download,
  FileSpreadsheet,
  Printer,
  Save,
  Trash2
} from 'lucide-react';
import DataTable from '../common/DataTable';
import ConfirmDialog from '../common/ConfirmDialog';

export function ReportsPanel({ projects, submissions, students, logs, onExportProjects, onExportSubmissions, onExportLogs }) {
  const reportItems = [
    { title: 'Data Projek', description: `${projects.length} projek terpublikasi`, action: onExportProjects },
    { title: 'Data Moderasi', description: `${submissions.length} histori pengajuan`, action: onExportSubmissions },
    { title: 'Log Aktivitas', description: `${logs.length} aktivitas terbaru`, action: onExportLogs }
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
        <FileSpreadsheet size={28} className="text-sky-300 mb-3" />
        <h2 className="font-heading font-bold text-xl">Pusat Laporan TRK</h2>
        <p className="text-sm text-slate-300 mt-1">Unduh data CSV atau cetak ringkasan dashboard untuk dokumentasi.</p>
        <button onClick={() => window.print()} className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-bold hover:bg-slate-100 shadow-sm">
          <Printer size={16} /> Cetak Ringkasan
        </button>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportItems.map((item) => (
          <article key={item.title} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
            <Download size={22} className="text-sky-600 mb-3" />
            <h3 className="font-heading font-bold text-sm text-slate-900">{item.title}</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">{item.description}</p>
            <button onClick={item.action} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-2xs transition-all">
              Unduh CSV
            </button>
          </article>
        ))}
      </div>

      <section className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
        <h2 className="font-heading font-bold text-base text-slate-900 mb-4">Ringkasan Data Saat Ini</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          {[
            ['Projek', projects.length],
            ['Mahasiswa', students.length],
            ['Pending', submissions.filter((item) => item.status === 'pending').length],
            ['Ditolak', submissions.filter((item) => item.status === 'rejected').length]
          ].map(([label, value]) => (
            <div key={label} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <strong className="block text-2xl font-black text-slate-900">{value}</strong>
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function SettingsPanel({ settings, onSave }) {
  const [formData, setFormData] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => setFormData(settings), [settings]);

  const submit = async (event) => {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  return (
    <div className="max-w-3xl">
      <ValidatedForm onSubmit={submit} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
        <div>
          <h2 className="font-heading font-bold text-base text-slate-900">Pengaturan Sistem</h2>
          <p className="text-xs text-slate-500 mt-1">Perubahan disimpan melalui backend dan berlaku untuk seluruh pengguna.</p>
        </div>
        <label className="block text-xs font-bold text-slate-700">
          Nama platform
          <input
            value={formData.siteName}
            onChange={(event) => setFormData((previous) => ({ ...previous, siteName: event.target.value }))}
            className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            required
          />
        </label>
        <label className="block text-xs font-bold text-slate-700">
          Tahun ajaran aktif
          <input
            value={formData.academicYear}
            onChange={(event) => setFormData((previous) => ({ ...previous, academicYear: event.target.value }))}
            className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            required
          />
        </label>
        <div className="space-y-3">
          {[
            ['moderationRequired', 'Wajib moderasi', 'Upload mahasiswa masuk ke antrean sebelum dipublikasikan.'],
            ['allowGuestUploads', 'Izinkan upload tamu', 'Pengunjung landing dapat membuka form upload.'],
            ['maintenanceMode', 'Mode pemeliharaan', 'Tandai sistem sedang dalam pemeliharaan.']
          ].map(([key, label, description]) => (
            <label key={key} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50/60 transition-colors cursor-pointer">
              <span>
                <strong className="block text-sm text-slate-800">{label}</strong>
                <span className="block text-xs text-slate-500 mt-0.5">{description}</span>
              </span>
              <input
                type="checkbox"
                checked={formData[key]}
                onChange={(event) => setFormData((previous) => ({ ...previous, [key]: event.target.checked }))}
                className="mt-1 w-4 h-4 accent-sky-600 rounded"
              />
            </label>
          ))}
        </div>
        <button disabled={isSaving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 shadow-2xs transition-all disabled:cursor-wait disabled:opacity-60">
          <Save size={16} /> {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </ValidatedForm>

    </div>
  );
}

const activityTypes = { login: 'Login admin', logout: 'Logout admin', project: 'Projek', submission: 'Pengajuan', success: 'Persetujuan', danger: 'Penghapusan / penolakan', taxonomy: 'Mata kuliah', user: 'Akun pengguna', settings: 'Pengaturan', system: 'Sistem', info: 'Informasi' };
const activityTime = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Jakarta' });

export function ActivityLogsPanel({ logs, onClear, onRefresh }) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const types = ['all', ...new Set([...Object.keys(activityTypes), ...logs.map((log) => log.type)])];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => (typeFilter === 'all' || log.type === typeFilter) &&
      (!dateFilter || new Date(log.timestamp).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }) === dateFilter));
  }, [logs, typeFilter, dateFilter]);

  const columns = [
    {
      key: 'message',
      label: 'Aktivitas / Perubahan',
      sortable: true,
      weight: 3,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
            <Activity size={15} />
          </div>
          <div className="text-xs text-slate-800 font-semibold leading-snug break-words min-w-0">
            {row.message.length > 250 ? <details>
              <summary className="cursor-pointer">{row.message.split('. ')[0]}. Lihat rincian</summary>
              <p className="mt-2 font-normal">{row.message}</p>
            </details> : row.message}
          </div>
        </div>
      )
    },
    {
      key: 'actor',
      label: 'Pelaku',
      sortable: true,
      searchValue: row => `${row.actor || 'Sistem'} ${row.actorEmail || ''}`,
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium">
          {row.actor || 'Sistem'}
          {row.actorEmail && <span className="block text-slate-500 break-all">{row.actorEmail}</span>}
        </span>
      )
    },
    {
      key: 'timestamp',
      label: 'Waktu (WIB)',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-mono text-slate-600">
          {Number.isNaN(Date.parse(row.timestamp)) ? row.timestamp : activityTime.format(new Date(row.timestamp))}
        </span>
      )
    },
    {
      key: 'type',
      label: 'Tipe',
      sortable: true,
      headerClassName: 'text-center',
      className: 'text-center',
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-600">
          {activityTypes[row.type] || row.type}
        </span>
      )
    }
  ];

  const filterActions = (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-xs font-medium text-slate-700">Jenis aktivitas
      <select
        aria-label="Jenis aktivitas"
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium text-slate-700 focus:outline-none"
      >
        {types.map((type) => (
          <option key={type} value={type}>
            {type === 'all' ? 'Semua aktivitas' : activityTypes[type] || type}
          </option>
        ))}
      </select>
      </label>
      <label className="text-xs font-medium text-slate-700">Tanggal (WIB)
        <input type="date" value={dateFilter} onChange={event => setDateFilter(event.target.value)} className="ml-2 min-h-11 rounded-xl border border-slate-200 px-3 bg-white" />
      </label>
      {(typeFilter !== 'all' || dateFilter) && <button className="text-xs text-sky-700 underline min-h-11" onClick={() => { setTypeFilter('all'); setDateFilter(''); }}>Reset filter</button>}
      {onRefresh && <button disabled={refreshing} className="min-h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold disabled:opacity-60" onClick={async () => {
        setRefreshing(true); setRefreshMessage('');
        try { setRefreshMessage(await onRefresh() === false ? 'Log belum dapat diperbarui. Coba lagi.' : 'Log berhasil diperbarui.'); }
        catch { setRefreshMessage('Log belum dapat diperbarui. Coba lagi.'); }
        finally { setRefreshing(false); }
      }}>{refreshing ? 'Memuat...' : 'Segarkan log'}</button>}
      <button
        onClick={() => setIsClearDialogOpen(true)}
        className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors shadow-2xs"
        title="Bersihkan seluruh log aktivitas"
        aria-label="Bersihkan seluruh log aktivitas"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
      <div>
        <h2 className="font-heading font-bold text-base text-slate-900">
          Log Aktivitas Sistem ({logs.length})
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Maksimal 200 aktivitas terbaru: login/logout admin, penambahan data, moderasi, dan perubahan pengaturan. Waktu ditampilkan dalam WIB.
        </p>
      </div>
      <p role="status" className="text-xs text-slate-600">{refreshMessage}</p>

      <DataTable
        data={filteredLogs}
        columns={columns}
        searchPlaceholder="Cari aktivitas atau pelaku..."
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        defaultSortKey="timestamp"
        defaultSortDirection="desc"
        extraHeaderActions={filterActions}
        showExportCsv={true}
        exportFileName="log-aktivitas-showcase.csv"
        emptyMessage={logs.length ? 'Tidak ada aktivitas yang cocok dengan filter.' : 'Belum ada aktivitas yang tercatat.'}
      />
      <ConfirmDialog
        isOpen={isClearDialogOpen}
        onClose={() => setIsClearDialogOpen(false)}
        onConfirm={onClear}
        title="Bersihkan seluruh log?"
        description={`${logs.length} aktivitas yang tersimpan akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Bersihkan log"
      />
    </section>
  );
}
