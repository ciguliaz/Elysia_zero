import { Elysia, t } from 'elysia'

const chat =
	new Elysia()
		.ws('/chat', {
			// Validate incoming messages
			body: t.Object({
				message: t.String(),
				sender: t.String()
			}),

			open(ws) {
				console.log(`User connected: ${ws.id}`);
			},

			message(ws, { message, sender }) {
				console.log(`Message from ${sender}: ${message}`);

				// Broadcast message to all connected clients
				ws.publish('/chat', {
					sender,
					message,
					time: new Date().toISOString()
				});
			},

			close(ws) {
				console.log(`User disconnected: ${ws.id}`);
			}
		});

export default chat
