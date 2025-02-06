import dotenv from 'dotenv';
import { Elysia } from 'elysia';
import mongoose from 'mongoose';
import { swagger } from '@elysiajs/swagger';

import authRoutes from './routes/auth';
import serverRoutes from './routes/server';
import chat from './routes/chat';
import { logDaR, logIdR, logLiR } from './utils/logFormat';
import { timestamps, logWithTime } from './utils/log';

dotenv.config();

const app = new Elysia();

mongoose.connect(process.env.MONGO_URI!)
	.then(() => logWithTime('MongoDB Connected'))
	.catch(err => console.error('MongoDB Error:', err));

app
	.use(swagger())
	.use(authRoutes)
	.use(serverRoutes)
	.use(chat)
	.listen(3000);

logWithTime('Server is running on ' + logLiR('http://localhost:3000'));
logWithTime('Swagger server is running on '+logLiR('http://localhost:3000/swagger'));
