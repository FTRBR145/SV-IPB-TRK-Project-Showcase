import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { loginRateLimit } from './middleware/rateLimit.js';
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
  app.use(env.apiPrefix, apiRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
