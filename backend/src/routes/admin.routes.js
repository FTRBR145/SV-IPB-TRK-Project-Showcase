import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { courseSchema, moderatorSchema, settingsSchema } from '../schemas/index.js';
import { ApiError, sendData } from '../utils/http.js';

const router = Router();

router.get('/courses', async (request, response) => {
  sendData(response, await request.app.locals.repository.getCourses());
});

router.get('/categories', async (request, response) => {
  sendData(response, await request.app.locals.repository.getCategories());
});

router.get('/settings/public', async (request, response) => {
  sendData(response, await request.app.locals.repository.getSettings());
});

router.use(authenticate, authorize('admin'));

router.post('/courses', validate(courseSchema), async (request, response) => {
  const course = await request.app.locals.repository.addCourse(request.body.name, request.user);
  if (!course) throw new ApiError(409, 'COURSE_EXISTS', 'Mata kuliah sudah tersedia.');
  sendData(response, { name: course }, 201);
});

router.patch('/courses/:name', validate(courseSchema), async (request, response) => {
  const result = await request.app.locals.repository.updateCourse(request.params.name, request.body.name, request.user);
  if (result.error === 'not_found') throw new ApiError(404, 'COURSE_NOT_FOUND', 'Mata kuliah tidak ditemukan.');
  if (result.error === 'exists') throw new ApiError(409, 'COURSE_EXISTS', 'Nama mata kuliah sudah tersedia.');
  sendData(response, {
    name: result.course,
    previousName: result.previousCourse,
    updatedProjects: result.updatedProjects,
    updatedSubmissions: result.updatedSubmissions
  });
});

router.delete('/courses/:name', async (request, response) => {
  const result = await request.app.locals.repository.deleteCourse(request.params.name, request.user);
  if (result.error === 'not_found') throw new ApiError(404, 'COURSE_NOT_FOUND', 'Mata kuliah tidak ditemukan.');
  if (result.error === 'in_use') throw new ApiError(409, 'COURSE_IN_USE', 'Mata kuliah masih digunakan oleh projek atau pengajuan.');
  sendData(response, result);
});

router.get('/moderators', async (request, response) => {
  sendData(response, await request.app.locals.repository.getModerators());
});

router.post('/moderators', validate(moderatorSchema), async (request, response) => {
  const moderator = await request.app.locals.repository.addModerator(request.body, request.user);
  if (!moderator) throw new ApiError(409, 'MODERATOR_EXISTS', 'Email moderator sudah terdaftar.');
  sendData(response, moderator, 201);
});

router.patch('/moderators/:id/status', async (request, response) => {
  const result = await request.app.locals.repository.toggleModerator(request.params.id, request.user);
  if (result.error === 'not_found') throw new ApiError(404, 'MODERATOR_NOT_FOUND', 'Moderator tidak ditemukan.');
  if (result.error === 'last_active') throw new ApiError(409, 'LAST_ACTIVE_MODERATOR', 'Minimal satu moderator harus tetap aktif.');
  sendData(response, result.moderator);
});

router.delete('/moderators/:id', async (request, response) => {
  const result = await request.app.locals.repository.deleteModerator(request.params.id, request.user);
  if (result.error === 'not_found') throw new ApiError(404, 'MODERATOR_NOT_FOUND', 'Moderator tidak ditemukan.');
  if (result.error === 'last_moderator') throw new ApiError(409, 'LAST_MODERATOR', 'Minimal satu moderator harus tersedia.');
  sendData(response, result.moderator);
});

router.get('/settings', async (request, response) => {
  sendData(response, await request.app.locals.repository.getSettings());
});

router.patch('/settings', validate(settingsSchema), async (request, response) => {
  sendData(response, await request.app.locals.repository.updateSettings(request.body, request.user));
});

router.get('/activity-logs', async (request, response) => {
  sendData(response, await request.app.locals.repository.getActivityLogs());
});

router.delete('/activity-logs', async (request, response) => {
  await request.app.locals.repository.clearActivityLogs(request.user);
  sendData(response, []);
});

router.post('/system/reset', async (request, response) => {
  await request.app.locals.repository.reset();
  sendData(response, { reset: true });
});

export default router;
