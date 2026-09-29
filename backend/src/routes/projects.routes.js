import { Router } from 'express';
import { authenticate, authorize, bestEffortAuthenticate, optionalAuthenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { bulkDeleteSchema, projectSchema, projectUpdateSchema, studentProjectUpdateSchema } from '../schemas/index.js';
import { ApiError, sendData } from '../utils/http.js';

const router = Router();

router.get('/', bestEffortAuthenticate, async (request, response) => {
  const scope = request.query.scope || 'public';
  if (!['public', 'all', 'mine'].includes(scope)) throw new ApiError(400, 'INVALID_SCOPE', 'Cakupan projek tidak valid.');
  if (scope === 'all' && request.user?.role !== 'admin') throw new ApiError(403, 'FORBIDDEN', 'Akses daftar semua projek hanya untuk admin.');
  if (scope === 'mine' && request.user?.role !== 'student') throw new ApiError(403, 'FORBIDDEN', 'Akses projek pribadi hanya untuk mahasiswa.');
  const { items, ...meta } = await request.app.locals.repository.listProjects({
    ...request.query,
    scope,
    nim: scope === 'mine' ? request.user.nim : request.query.nim
  });
  sendData(response, items, 200, meta);
});

router.get('/:id', bestEffortAuthenticate, async (request, response) => {
  const project = await request.app.locals.repository.findProjectById(request.params.id);
  if (!project || (project.isPublished === false && request.user?.role !== 'admin' &&
    !(request.user?.role === 'student' && request.user.nim === project.nim))) {
    throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Projek tidak ditemukan.');
  }
  sendData(response, project);
});

router.post('/', optionalAuthenticate, validate(projectSchema), async (request, response) => {
  const repository = request.app.locals.repository;
  const settings = await repository.getSettings();
  if (settings.maintenanceMode) {
    throw new ApiError(503, 'MAINTENANCE_MODE', 'Upload sedang dinonaktifkan selama pemeliharaan.');
  }

  if (!request.user && !settings.allowGuestUploads) {
    throw new ApiError(401, 'LOGIN_REQUIRED', 'Silakan masuk sebelum mengunggah projek.');
  }

  const actorName = request.user?.name || request.body.student || 'Tamu';
  const projectData = {
    ...request.body,
    student: request.user?.role === 'student' ? request.user.name : request.body.student || actorName,
    nim: request.user?.role === 'student' ? request.user.nim : request.body.nim || request.user?.nim || '-',
    prodi: 'Teknologi Rekayasa Komputer',
    prodiCode: 'TRK',
    year: request.body.year || settings.academicYear,
    date: request.body.date || new Date().toISOString()
  };

  if (request.user?.role !== 'admin') {
    const submission = await repository.createSubmission(projectData, request.user || 'Tamu');
    return sendData(response, { type: 'submission', item: submission }, 202);
  }

  const project = await repository.createProject(projectData, request.user || 'Tamu');
  return sendData(response, { type: 'project', item: project }, 201);
});

router.post('/bulk-delete', authenticate, authorize('admin'), validate(bulkDeleteSchema), async (request, response) => {
  const result = await request.app.locals.repository.deleteProjects(request.body.ids, request.user);
  if (result.error === 'not_found') {
    throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Satu atau beberapa projek tidak ditemukan. Tidak ada projek yang dihapus.');
  }
  sendData(response, { ids: result.projects.map((project) => project.id), deletedCount: result.projects.length });
});

router.patch('/:id', authenticate, authorize('admin', 'student'), (request, response, next) =>
  validate(request.user.role === 'student' ? studentProjectUpdateSchema : projectUpdateSchema)(request, response, next), async (request, response) => {
  const project = await request.app.locals.repository.updateProject(request.params.id, request.body, request.user);
  if (!project) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Projek tidak ditemukan.');
  if (project.error === 'publication_locked') throw new ApiError(409, 'PUBLICATION_LOCKED', 'Projek ini disembunyikan admin. Hanya admin yang dapat menayangkannya kembali.');
  sendData(response, project);
});

router.delete('/:id', authenticate, authorize('admin', 'student'), async (request, response) => {
  const project = await request.app.locals.repository.deleteProject(request.params.id, request.user);
  if (!project) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Projek tidak ditemukan.');
  sendData(response, project);
});

export default router;
