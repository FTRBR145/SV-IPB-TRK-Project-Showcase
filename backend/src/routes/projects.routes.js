import { Router } from 'express';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { bulkDeleteSchema, projectSchema, projectUpdateSchema } from '../schemas/index.js';
import { ApiError, sendData } from '../utils/http.js';

const router = Router();

router.get('/', async (request, response) => {
  const { items, ...meta } = await request.app.locals.repository.listProjects(request.query);
  sendData(response, items, 200, meta);
});

router.get('/:id', async (request, response) => {
  const project = await request.app.locals.repository.findProjectById(request.params.id);
  if (!project) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Projek tidak ditemukan.');
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

router.patch('/:id', authenticate, authorize('admin'), validate(projectUpdateSchema), async (request, response) => {
  const project = await request.app.locals.repository.updateProject(request.params.id, request.body, request.user);
  if (!project) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Projek tidak ditemukan.');
  sendData(response, project);
});

router.delete('/:id', authenticate, authorize('admin'), async (request, response) => {
  const project = await request.app.locals.repository.deleteProject(request.params.id, request.user);
  if (!project) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Projek tidak ditemukan.');
  sendData(response, project);
});

export default router;
