import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { submissionUpdateSchema } from '../schemas/index.js';
import { ApiError, sendData } from '../utils/http.js';

const router = Router();

router.use(authenticate);

router.get('/mine', authorize('student'), async (request, response) => {
  sendData(response, await request.app.locals.repository.listSubmissions({ nim: request.user.nim }));
});

router.get('/', authorize('admin'), async (request, response) => {
  sendData(response, await request.app.locals.repository.listSubmissions({ status: request.query.status }));
});

router.patch('/:id', authorize('student'), validate(submissionUpdateSchema), async (request, response) => {
  const result = await request.app.locals.repository.updateSubmission(
    request.params.id,
    request.body,
    request.user.nim,
    request.user
  );
  if (result.error === 'not_found') {
    throw new ApiError(404, 'SUBMISSION_NOT_FOUND', 'Pengajuan tidak ditemukan atau bukan milik Anda.');
  }
  if (result.error === 'invalid_status') {
    throw new ApiError(409, 'INVALID_SUBMISSION_STATUS', 'Hanya pengajuan yang masih menunggu persetujuan yang dapat diedit.');
  }
  sendData(response, result.submission);
});

function resolveModerationResult(result, response, status = 200) {
  if (result.error === 'not_found') throw new ApiError(404, 'SUBMISSION_NOT_FOUND', 'Pengajuan tidak ditemukan.');
  if (result.error === 'invalid_status') {
    throw new ApiError(409, 'INVALID_SUBMISSION_STATUS', 'Pengajuan ini tidak lagi berstatus menunggu.');
  }
  return sendData(response, result, status);
}

router.post('/:id/approve', authorize('admin'), async (request, response) => {
  resolveModerationResult(
    await request.app.locals.repository.approveSubmission(request.params.id, request.user),
    response
  );
});

router.post('/:id/reject', authorize('admin'), async (request, response) => {
  resolveModerationResult(
    await request.app.locals.repository.rejectSubmission(request.params.id, request.user),
    response
  );
});

router.post('/:id/restore', authorize('admin'), async (request, response) => {
  resolveModerationResult(
    await request.app.locals.repository.restoreSubmission(request.params.id, request.user),
    response
  );
});

export default router;
