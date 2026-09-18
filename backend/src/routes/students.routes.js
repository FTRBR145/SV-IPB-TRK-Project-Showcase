import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { studentSchema } from '../schemas/index.js';
import { ApiError, sendData } from '../utils/http.js';

const router = Router();
router.use(authenticate, authorize('admin'));

async function inspect(repository, input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 500) {
    throw new ApiError(422, 'INVALID_STUDENTS', 'Isi 1–500 mahasiswa dalam satu impor.');
  }
  const existing = await repository.getUserIdentifiers();
  const emails = new Set(existing.map(user => user.email?.toLowerCase()));
  const nims = new Set(existing.map(user => user.nim?.toUpperCase()));
  const labels = { name: 'Nama wajib diisi (2–120 karakter).', nim: 'NIM wajib 3–30 huruf, angka, atau tanda hubung.', email: 'Alamat email tidak valid.', semester: 'Semester harus angka bulat 1–14.', angkatan: 'Angkatan wajib diisi (maksimal 40 karakter).' };
  // Check identities independently, even when another field in the row is invalid.
  const identities = input.map(entry => Object.fromEntries(['email', 'nim'].map(key => {
    const parsed = studentSchema.shape[key].safeParse(entry?.[key]);
    return [key, parsed.success ? parsed.data : null];
  })));
  const counts = { email: new Map(), nim: new Map() };
  for (const identity of identities) for (const key of ['email', 'nim']) {
    if (identity[key]) counts[key].set(identity[key], (counts[key].get(identity[key]) || 0) + 1);
  }
  return input.map((entry, index) => {
    const parsed = studentSchema.safeParse(entry);
    const fieldErrors = {};
    if (!parsed.success) for (const issue of parsed.error.issues) {
      const field = issue.path[0] || '_row';
      fieldErrors[field] = labels[field] || 'Data tidak valid.';
    }
    for (const [key, existingValues, label] of [['email', emails, 'Email'], ['nim', nims, 'NIM']]) {
      const value = identities[index][key];
      if (value && (existingValues.has(value) || counts[key].get(value) > 1)) {
        fieldErrors[key] = label + ' duplikat atau sudah terdaftar.';
      }
    }
    return { row: index + 1, student: parsed.success ? parsed.data : entry, errors: Object.values(fieldErrors), fieldErrors };
  });
}

router.get('/', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  sendData(res, await req.app.locals.repository.listStudents());
});

router.post('/preview', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const rows = await inspect(req.app.locals.repository, req.body.students);
  sendData(res, { rows, valid: rows.every(row => row.errors.length === 0) });
});

router.post('/', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const repository = req.app.locals.repository;
  const rows = await inspect(repository, req.body.students);
  if (rows.some(row => row.errors.length)) {
    throw new ApiError(422, 'INVALID_STUDENTS', 'Data belum disimpan. Perbaiki baris yang bermasalah.', rows.filter(row => row.errors.length));
  }
  const credentials = [];
  const users = [];
  for (const { student } of rows) {
    const password = `TRK-${randomBytes(18).toString('base64url')}`;
    credentials.push({ name: student.name, nim: student.nim, email: student.email, password });
    users.push({ ...student, role: 'student', roleName: 'Mahasiswa TRK SV IPB', passwordHash: await bcrypt.hash(password, 10) });
  }
  const students = await repository.createStudents(users, req.user);
  sendData(res, { students, credentials }, 201);
});

router.patch('/:id', validate(studentSchema), async (req, res) => {
  const student = await req.app.locals.repository.updateStudent(req.params.id, req.body, req.user);
  if (student?.error === 'not_found') throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Akun mahasiswa tidak ditemukan.');
  if (student?.error === 'duplicate') throw new ApiError(409, 'STUDENT_EXISTS', 'NIM atau email sudah terdaftar pada akun lain.');
  sendData(res, student);
});

router.delete('/:id', async (req, res) => {
  const result = await req.app.locals.repository.deleteStudent(req.params.id, req.user);
  if (result.error === 'not_found') throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Akun mahasiswa tidak ditemukan.');
  sendData(res, result.student);
});

export default router;
