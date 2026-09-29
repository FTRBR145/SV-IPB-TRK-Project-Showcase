// Only this allowlist may be copied from an authenticated user into the audit log.
export function activityActor(actor = 'Sistem') {
  if (typeof actor === 'string') return { actor };
  return { actor: actor.name, actorId: actor.id, actorEmail: actor.email, actorRole: actor.role };
}

export function prepareProjectUpdate(previous, updates, actor) {
  if (actor?.role === 'student' && (!actor.nim || !previous.nim || String(previous.nim) !== String(actor.nim))) return { error: 'not_found' };
  if (actor?.role === 'student' && 'isPublished' in updates &&
    previous.isPublished === false && previous.publicationLockedByAdmin !== false) {
    return { error: 'publication_locked' };
  }
  const nextUpdates = { ...updates };
  if (actor?.role === 'admin' && 'isPublished' in updates) {
    nextUpdates.publicationLockedByAdmin = !updates.isPublished;
    nextUpdates.publicationReason = updates.isPublished ? null : updates.publicationReason?.trim() || null;
  } else if (actor?.role === 'student' && 'isPublished' in updates) {
    nextUpdates.publicationLockedByAdmin = false;
    nextUpdates.publicationReason = null;
  }
  const changes = actor?.role === 'student' ? Object.fromEntries(
    Object.keys(updates)
      .filter(key => JSON.stringify(previous[key] ?? null) !== JSON.stringify(updates[key] ?? null))
      .map(key => [key, { before: previous[key] ?? null, after: updates[key] ?? null }])
  ) : null;
  return { updates: nextUpdates, changes };
}

export function studentActivity(students) {
  if (students.length === 1) return `Akun mahasiswa ${students[0].name} (NIM ${students[0].nim}) ditambahkan.`;
  return `${students.length} akun mahasiswa ditambahkan melalui impor massal. NIM: ${students.map(student => student.nim).join(', ')}.`;
}

const settingLabels = { siteName: 'Nama platform', academicYear: 'Tahun ajaran', moderationRequired: 'Wajib moderasi', allowGuestUploads: 'Upload tamu', maintenanceMode: 'Mode pemeliharaan' };
export function settingsActivity(before, after) {
  const display = value => typeof value === 'boolean' ? (value ? 'aktif' : 'nonaktif') : String(value ?? '—');
  const changes = Object.entries(settingLabels).filter(([key]) => before[key] !== after[key]);
  return changes.length ? `Pengaturan diubah: ${changes.map(([key, label]) => `${label}: ${display(before[key])} → ${display(after[key])}`).join('; ')}.` : null;
}
