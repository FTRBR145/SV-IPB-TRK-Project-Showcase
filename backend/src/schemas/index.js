import { z } from 'zod';

const optionalText = (max) => z.string().trim().max(max).optional();

export const profileSchema = z.object({ name: z.string().trim().min(2).max(120) }).strict();
export const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(72).refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password maksimal 72 byte.')
}).strict();

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(160).optional(),
  email: z.email().transform((value) => value.toLowerCase()).optional(),
  password: z.string().min(8).max(128)
}).refine((value) => value.identifier || value.email, {
  message: 'NIM, NIP, atau email wajib diisi.',
  path: ['identifier']
});

export const projectSchema = z.object({
  title: z.string().trim().min(3).max(160),
  student: optionalText(120),
  nim: optionalText(30),
  course: z.string().trim().min(2).max(160),
  category: optionalText(80),
  semester: z.coerce.number().int().min(1).max(14),
  techStack: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  videoUrl: z.url(),
  thumbnail: z.url().optional(),
  supervisor: optionalText(160),
  year: optionalText(20),
  date: optionalText(40),
  description: z.string().trim().min(10).max(5000)
});

export const projectUpdateSchema = projectSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Minimal satu perubahan wajib dikirim.');

export const submissionUpdateSchema = projectSchema
  .pick({
    title: true,
    course: true,
    category: true,
    semester: true,
    techStack: true,
    videoUrl: true,
    thumbnail: true,
    supervisor: true,
    description: true
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Minimal satu perubahan wajib dikirim.');

export const bulkDeleteSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(100)
    .transform((ids) => [...new Set(ids)])
}).strict();

export const courseSchema = z.object({
  name: z.string().trim().min(3).max(160)
});

export const moderatorSchema = z.object({
  role: z.enum(['admin', 'lecturer']).default('admin'),
  name: z.string().trim().min(3).max(120),
  nip: z.string().trim().max(40).optional().default(''),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72).refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password maksimal 72 byte.')
}).strict();

export const studentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  nim: z.string().trim().min(3).max(30).regex(/^[a-z0-9-]+$/i).transform(value => value.toUpperCase()),
  email: z.email().max(160).transform(value => value.toLowerCase()),
  semester: z.coerce.number().int().min(1).max(14),
  angkatan: z.string().trim().min(1).max(40)
});

export const settingsSchema = z.object({
  siteName: z.string().trim().min(3).max(120).optional(),
  academicYear: z.string().trim().min(4).max(20).optional(),
  moderationRequired: z.boolean().optional(),
  allowGuestUploads: z.boolean().optional(),
  maintenanceMode: z.boolean().optional()
}).refine((value) => Object.keys(value).length > 0, 'Minimal satu pengaturan wajib dikirim.');
