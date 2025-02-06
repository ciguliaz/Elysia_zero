import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";

export const authenticate = new Elysia()
	// Use the JWT plugin and configure it with a secret key
	.use(
		jwt({
			name: "jwt", // The function will be accessible as `jwt`
			secret: process.env.JWT_SECRET!, // Secret key for signing and verifying JWT
		})
	)
	//! Middleware that runs before request handling, ensuring the Authorization header exists
	.onBeforeHandle(({ headers }) => {
		if (!headers.authorization) {
			throw new Error("Authorization header is required"); // Prevents requests without Authorization header
		}
	})
	// Derives user data by verifying the JWT token
	.derive(
		async ({
			jwt,
			headers,
		}: {
			jwt: { verify: (token: string) => Promise<any> }; // Ensures `jwt` has a `verify` function
			headers: { authorization?: string }; // `authorization` header is optional but checked earlier
		}) => {
			const token = headers.authorization?.split(" ")[1]; // Extracts token from "Bearer <token>"
			if (!token) return { error: "Unauthorized" }; // Rejects requests without a token

			const user = await jwt.verify(token); //! Verifies the JWT token
			if (!user) return { error: "Invalid token" }; // Rejects invalid tokens

			return { user }; // Returns the decoded user data
		}
	);