import express from 'express';
import cors from 'cors';
import tasksRouter from './routes/tasks';
import authRouter from './routes/auth';
import teamsRouter from './routes/teams';
import projectsRouter from './routes/projects';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';

const app = express();
// Enable CORS — allow configuring origin with CORS_ORIGIN env var (set to frontend origin in production)
const corsOrigin = process.env.CORS_ORIGIN || true;
app.use(cors({ origin: corsOrigin, credentials: true }));

app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/projects', projectsRouter);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (_req, res) => res.json({ ok: true }));

export default app;
