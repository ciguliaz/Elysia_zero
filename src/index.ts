import dotenv from 'dotenv';
import { Elysia } from 'elysia';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import chat from './routes/chat';
import { logDaR, logIdR } from './utils/logFormat';
import { timestamps, logWithTime } from './utils/log';

dotenv.config();

const app = new Elysia();

mongoose.connect(process.env.MONGO_URI!)
	.then(() => logWithTime('MongoDB Connected'))
	.catch(err => console.error('MongoDB Error:', err));

app
	.use(authRoutes)
	.use(chat)
	.listen(3000);

logWithTime('Server is running on http://localhost:3000');