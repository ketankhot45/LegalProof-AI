import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import path from 'path';

// Load routes
import authRoutes from './routes/auth.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import caseRoutes from './routes/case.routes.js';
import evidenceRoutes from './routes/evidence.routes.js';
import blockchainRoutes from './routes/blockchain.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const PORT = 3000;

async function startServer() {
  const app = express();

  // Trust the first proxy to correctly handle X-Forwarded-For headers
  app.set('trust proxy', 1);

  const isProduction = process.env.NODE_ENV === 'production';

  // Security Middlewares
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'blob:'],
              connectSrc: ["'self'"],
              fontSrc: ["'self'", 'data:'],
              objectSrc: ["'none'"],
              frameAncestors: ["'self'"],
            },
          }
        : false, // Disabled for Vite development mode
    })
  );

  // Environment-aware CORS configuration
  if (!isProduction) {
    app.use(cors());
  } else {
    const rawAllowedOrigins = process.env.ALLOWED_ORIGINS;
    if (rawAllowedOrigins) {
      const allowedOrigins = rawAllowedOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

      app.use(
        cors({
          origin: (origin, callback) => {
            // Allow same-origin / non-browser requests without origin header, or origins explicitly allowed
            if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true);
            } else {
              callback(new Error('CORS policy: Origin not allowed'));
            }
          },
          credentials: true,
        })
      );
    } else {
      // Default to standard origin handling when no external origins specified
      app.use(cors());
    }
  }
  app.use(express.json());
  app.use(morgan('dev'));

  // Tiered Rate Limiters
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Generous ceiling for authenticated investigator & complainant operations
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 25, // Strict limit to protect against brute force login/registration
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' }
  });

  const publicBlockchainLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60, // Limit public blockchain query endpoint against scraping/DDoS
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    message: { error: 'Too many verification requests. Please try again later.' }
  });

  app.use('/api', apiLimiter);

  // Health Check
  app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes with targeted limiters
  app.use('/api/v1/auth', authLimiter, authRoutes);
  app.use('/api/v1/complaints', complaintRoutes);
  app.use('/api/v1/cases', caseRoutes);
  app.use('/api/v1/blockchain', publicBlockchainLimiter, blockchainRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use('/api/v1', evidenceRoutes);

  // Vite Middleware for SPA and Dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (
      err?.name === 'PrismaClientInitializationError' ||
      err?.code === 'P1001' ||
      (typeof err?.message === 'string' && err.message.includes("Can't reach database server"))
    ) {
      console.warn('Database request error: PostgreSQL server is currently unreachable.');
      return res.status(503).json({
        error: 'Database connection error: Unable to reach PostgreSQL database. Please ensure DATABASE_URL in Settings / Secrets points to a publicly accessible database host (not localhost).'
      });
    }
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LegalProof AI backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
