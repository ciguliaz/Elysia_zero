import jwt from "@elysiajs/jwt";
import { Elysia, t } from "elysia";
import { login, register } from "../controllers/authController";
import * as log from '../utils/log';


const authRoutes =
	new Elysia()
		.use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET! }))
		.post('/register', async ({ body }) => {
			const { username, password } = body as { username: string; password: string }; // Casts body to the expected type
			const user = await register(username, password)
			return { success: true, user }
		},
			/*Input Validation with t.Object()
			Ensures requests include username and password as strings.
			Prevents invalid data from reaching your controller.*/
			{
				body: t.Object({
					username: t.String(),
					password: t.String()
				})
			})
		.post('/login', async ({ body, jwt }) => {
			const { username, password } = body as { username: string; password: string };
			const user = await login(username, password)
			if (!user) return { error: "Invalid Credentials" }
			/*
			This function generates a JWT (JSON Web Token), which is commonly used for user authentication.
			It takes a payload (the data you want to embed in the token) and returns a signed token.
			Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YzZlMWFhZjJkMTIzNDU2Nzg5YWJjZCIsInVzZXJuYW1lIjoiam9obl9kb2UifQ.sJ5G_qPxr9Abg-QZK1Nk-Tp7T6z3...
			*/
			const token = await jwt.sign({ id: user._id.toString(), username: user.username })
			log.stamp(log.PathR() + `${log.Raw('token', 32)} of ${log.Raw(user.username, 96)}: ${token}`)
			return { token }
		}, {
			body: t.Object({
				username: t.String(),
				password: t.String()
			})
		})

export default authRoutes