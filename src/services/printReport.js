const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const statusLabel = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak'
};

const renderRows = (rows, columns, emptyMessage) => rows.length
  ? rows.map((row, index) => `<tr>${columns.map((column) => `<td>${escapeHtml(column.value(row, index))}</td>`).join('')}</tr>`).join('')
  : `<tr><td colspan="${columns.length}" class="empty">${escapeHtml(emptyMessage)}</td></tr>`;

const renderTable = (title, rows, columns, emptyMessage) => `
  <section>
    <h2>${escapeHtml(title)}</h2>
    <table>
      <thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}</tr></thead>
      <tbody>${renderRows(rows, columns, emptyMessage)}</tbody>
    </table>
  </section>`;

export function buildShowcaseReport({ projects = [], submissions = [], students = [], logs = [] }, generatedAt = new Date()) {
  const dateLabel = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(generatedAt);
  const pending = submissions.filter((item) => item.status === 'pending').length;
  const approved = submissions.filter((item) => item.status === 'approved').length;
  const rejected = submissions.filter((item) => item.status === 'rejected').length;

  const projectColumns = [
    { label: 'No.', value: (_row, index) => index + 1 },
    { label: 'Judul Projek', value: row => row.title },
    { label: 'Mahasiswa', value: row => row.student },
    { label: 'NIM', value: row => row.nim },
    { label: 'Mata Kuliah', value: row => row.course },
    { label: 'Semester', value: row => row.semester },
    { label: 'Tahun', value: row => row.year || '—' }
  ];
  const studentColumns = [
    { label: 'No.', value: (_row, index) => index + 1 },
    { label: 'NIM', value: row => row.nim },
    { label: 'Nama Mahasiswa', value: row => row.name },
    { label: 'Angkatan', value: row => row.angkatan || '—' },
    { label: 'Semester', value: row => row.semester || '—' },
    { label: 'Jumlah Projek', value: row => row.projectCount || 0 }
  ];
  const submissionColumns = [
    { label: 'No.', value: (_row, index) => index + 1 },
    { label: 'Judul Pengajuan', value: row => row.title },
    { label: 'Mahasiswa', value: row => row.student },
    { label: 'NIM', value: row => row.nim },
    { label: 'Mata Kuliah', value: row => row.course },
    { label: 'Status', value: row => statusLabel[row.status] || row.status }
  ];

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Laporan Project Showcase TRK</title>
  <style>
    :root { color-scheme: light; font-family: Arial, Helvetica, sans-serif; color: #0f172a; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #e2e8f0; }
    .toolbar { position: sticky; top: 0; display: flex; justify-content: flex-end; padding: 12px 20px; background: #0f172a; }
    .toolbar button { min-height: 44px; padding: 0 18px; border: 0; border-radius: 10px; background: #fff; color: #0f172a; font-weight: 700; cursor: pointer; }
    main { width: min(1120px, calc(100% - 32px)); margin: 24px auto; padding: 36px; background: #fff; }
    header { display: flex; justify-content: space-between; gap: 32px; padding-bottom: 20px; border-bottom: 2px solid #0f172a; }
    .brand { font-size: 13px; font-weight: 700; color: #0369a1; }
    h1 { margin: 5px 0 0; font-size: 25px; line-height: 1.2; }
    .meta { max-width: 320px; text-align: right; font-size: 11px; line-height: 1.6; color: #475569; }
    .summary { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin: 22px 0 30px; }
    .metric { padding: 12px; border: 1px solid #cbd5e1; border-radius: 10px; }
    .metric strong { display: block; font-size: 20px; }
    .metric span { font-size: 10px; color: #64748b; }
    section { margin-top: 28px; }
    h2 { margin: 0 0 10px; font-size: 15px; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th, td { padding: 7px 8px; border: 1px solid #cbd5e1; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
    th { background: #e2e8f0; font-weight: 700; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .empty { padding: 18px; text-align: center; color: #64748b; }
    footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #cbd5e1; font-size: 9px; color: #64748b; }
    @page { size: A4 landscape; margin: 12mm; }
    @media print {
      body { background: #fff; }
      .toolbar { display: none; }
      main { width: auto; margin: 0; padding: 0; }
      thead { display: table-header-group; }
      tr { break-inside: avoid; }
      section { break-before: auto; }
    }
    @media (max-width: 760px) {
      main { width: 100%; margin: 0; padding: 20px; }
      header { flex-direction: column; }
      .meta { text-align: left; }
      .summary { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <div class="toolbar"><button type="button" onclick="window.print()">Cetak / Simpan PDF</button></div>
  <main>
    <header>
      <div><div class="brand">IPB University · Sekolah Vokasi</div><h1>Laporan Project Showcase<br>Teknologi Rekayasa Komputer</h1></div>
      <div class="meta"><strong>Dokumen laporan operasional</strong><br>Dibuat pada ${escapeHtml(dateLabel)} WIB<br>Sumber: Dashboard Project Showcase TRK</div>
    </header>
    <div class="summary">
      ${[
        ['Projek', projects.length], ['Mahasiswa', students.length], ['Pengajuan', submissions.length],
        ['Menunggu', pending], ['Disetujui', approved], ['Ditolak', rejected]
      ].map(([label, value]) => `<div class="metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join('')}
    </div>
    ${renderTable('Daftar Projek Terpublikasi', projects, projectColumns, 'Belum ada projek terpublikasi.')}
    ${renderTable('Daftar Mahasiswa', students, studentColumns, 'Belum ada mahasiswa terdaftar.')}
    ${renderTable('Riwayat Moderasi Pengajuan', submissions, submissionColumns, 'Belum ada riwayat pengajuan.')}
    <footer>Total aktivitas sistem yang tercatat saat laporan dibuat: ${escapeHtml(logs.length)}. Dokumen ini dibuat otomatis oleh Project Showcase TRK.</footer>
  </main>
</body>
</html>`;
}

export function openShowcaseReport(data) {
  const reportWindow = window.open('', '_blank');
  if (!reportWindow) return false;
  reportWindow.document.open();
  reportWindow.document.write(buildShowcaseReport(data));
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.setTimeout(() => reportWindow.print(), 250);
  return true;
}
