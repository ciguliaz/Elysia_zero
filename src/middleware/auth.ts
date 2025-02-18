import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import * as log from '../utils/log'

export const authenticate = new Elysia()
	// Use the JWT plugin and configure it with a secret key
	.use(
		jwt({
			name: "jwt", // The function will be accessible as `jwt`
			secret: process.env.JWT_SECRET!, // Secret key for signing and verifying JWT
		})
	)
	//* Middleware that runs before request handling, ensuring the Authorization header exists
	.onBeforeHandle(({ headers, set }) => {
		if (!headers.authorization) {
			set.status = 401;
			return { error: "Authorization header is required" }; // Prevents requests without Authorization header
		}
	})
	// Derives user data by verifying the JWT token
	.derive( // https://elysiajs.com/essential/handler.html#derive
		{ as: 'scoped' }, //! THIS IS REQUIRED, OMITTING THIS WILL PREVENT DERIVER THE USER
		async ({
			jwt,
			headers,
			set,
		}: {
			jwt: { verify: (token: string) => Promise<any> }; // Ensures `jwt` has a `verify` function
			headers: { authorization?: string }; // `authorization` header is optional but checked earlier
			set: any;
			body: any
		}) => {
			log.stamp(log.PathR() + 'Deriving Token')
			const token = headers.authorization?.split(" ")[1]; //* Extracts token from "Bearer <token>"
			if (!token) {
				set.status = 401; //Unauthorized
				log.stamp(log.PathR() + log.ErR('No token - Unauthorized'))
				return { error: "Unauthorized" }; // Rejects requests without a token
			}

			try {
				const user = await jwt.verify(token); //* Verifies the JWT token
				if (user) {
					return { user }; // Returns the decoded user data
				}
			} catch {
				set.status = 403; //Forbidden
				log.stamp(log.PathR() + log.ErR('Bad token - Forbidden'))
				return { error: "Invalid token" }; // Rejects invalid tokens
			}
		}
	)