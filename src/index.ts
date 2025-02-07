import { swagger } from '@elysiajs/swagger';
import dotenv from 'dotenv';
import { Elysia } from 'elysia';
import mongoose from 'mongoose';

import authRoutes from './routes/auth';
import channelRoutes from './routes/channel';
import chat from './routes/chat';
import serverRoutes from './routes/server';

import * as log from './utils/log';

dotenv.config();

const app = new Elysia();

mongoose.connect(process.env.MONGO_URI!)
	.then(() => log.WithTime('MongoDB Connected'))
	.catch(err => console.error('MongoDB Error:', err));

app
	.use(authRoutes)
	.use(serverRoutes)
	.use(channelRoutes)
	.use(chat)
	.use(swagger())
	.listen(3000);

log.WithTime(log.Ely('Elysia greeting ~') + ' on ' + log.LiR('http://localhost:3000'));
log.WithTime('Swagger server is running on ' + log.LiR('http://localhost:3000/swagger'));
