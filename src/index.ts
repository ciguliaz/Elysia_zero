import { Elysia } from 'elysia';
import authRoutes from './routes/auth';
import chat from './routes/chat';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = new Elysia();

mongoose.connect(process.env.MONGO_URI!)
	.then(() => console.log('MongoDB Connected'))
	.catch(err => console.error('MongoDB Error:', err));

app
	.use(authRoutes)
	.use(chat)
	.listen(3000);

console.log('Server is running on http://localhost:3000');