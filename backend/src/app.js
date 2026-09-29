import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { loginRateLimit } from './middleware/rateLimit.js';
import { ApiError } from './utils/http.js';
import { projectHtml, siteOrigin, unavailableProjectHtml } from './utils/projectHtml.js';
import apiRoutes from './routes/index.js';

export function createApp({ repository, loginLimiter = loginRateLimit() } = {}) {
  if (!repository) throw new Error('Repository wajib diberikan saat membuat API.');
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.locals.repository = repository;

  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.frontendOrigins.includes('*') || env.frontendOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true
  }));
  app.use((request, response, next) => {
    if (request.headers.cookie || request.headers.authorization) response.set('Cache-Control', 'no-store');
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next();
    const origin = request.get('origin');
    if (origin
      ? origin === `${request.protocol}://${request.get('host')}` || env.frontendOrigins.includes(origin)
      : !['cross-site', 'same-site'].includes(request.get('sec-fetch-site'))) return next();
    return next(new ApiError(403, 'INVALID_ORIGIN', 'Asal permintaan tidak diizinkan.'));
  });
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use('/api/auth/login', loginLimiter);
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  app.get('/', (_request, response) => {
    response.json({
      success: true,
      data: {
        service: 'Showcase Projek TRK API',
        health: `${env.apiPrefix}/health`
      }
    });
  });
  app.get('/project/:id', async (request, response, next) => {
    if (!/^\d+$/.test(request.params.id)) return next();
    try {
      const project = await repository.findProjectById(request.params.id);
      const shell = await fetch(`${siteOrigin}/index.html`, { headers: { accept: 'text/html' }, cache: 'no-store' });
      if (!shell.ok) return response.status(503).send('Halaman belum tersedia.');
      const html = await shell.text();
      const publicProject = project && project.isPublished !== false;
      const body = publicProject
        ? projectHtml(html, project, `${siteOrigin}/project/${request.params.id}`)
        : unavailableProjectHtml(html);
      return response.status(publicProject ? 200 : 404).type('html').set({
        'Cache-Control': 'no-store',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self'; frame-src https://www.youtube.com https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Frame-Options': 'DENY'
      }).send(body);
    } catch (error) {
      return next(error);
    }
  });
  app.use(env.apiPrefix, apiRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
