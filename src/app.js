import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/error';
import authRoutes from './routes/auth';
import lessonRoutes from './routes/lessons';
import quizRoutes from './routes/quizzes';
import userRoutes from './routes/users';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);

app.use(errorHandler);

export default app;
