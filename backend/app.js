import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { cacheHeaders, performanceMonitor } from './middleware/performanceMiddleware.js';
import { apiRateLimiter } from './middleware/rateLimitMiddleware.js';
import { requestLogger } from './middleware/requestLogger.js';
import healthRoutes from './routes/healthRoutes.js';
import apiRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: env.clientUrl,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  }),
);
app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(performanceMonitor);
app.use(cacheHeaders);
app.use(requestLogger);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', apiRateLimiter);

app.use('/health', healthRoutes);

app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
