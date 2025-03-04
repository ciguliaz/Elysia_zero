// import { Elysia, t } from 'elysia'

// const chat =
// 	new Elysia()
// 		.ws('/chat', {
// 			// Validate incoming messages
// 			body: t.Object({
// 				message: t.String(),
// 				sender: t.String()
// 			}),

// 			open(ws) {
// 				console.log(`User connected: ${ws.id}`);
// 			},

// 			message(ws, { message, sender }) {
// 				console.log(`Message from ${sender}: ${message}`);

// 				// Broadcast message to all connected clients
// 				ws.publish('/chat', {
// 					sender,
// 					message,
// 					time: new Date().toISOString()
// 				});
// 			},

// 			close(ws) {
// 				console.log(`User disconnected: ${ws.id}`);
// 			}
// 		});

// export default chat


import { Elysia, t } from "elysia";
import { authenticate } from "../middleware/auth";
import { Validate } from "../utils/Validate";
import { ChatService } from "../services/ChatService";
import Channel from "../models/Channel";
import Server from "../models/Server";
import * as log from "../utils/log"
// Define a User type for clarity
// interface UserType {
// 	id: any;
// }

const chatRoutes = new Elysia({ prefix: 'chat' }).use(authenticate)

	// ----- DM Channel Routes -----
	// Get details of a DM channel
	.get("/@dm/:channelId", async ({ params, user, set }) => {
		//TODO: refactor
		const { channelId } = params as { channelId: string };
		const thisUser = await Validate.tryGetUser(user, set)

		if ('error' in thisUser) return thisUser;
		// Find the DM channel (with type "dm") where the user is a participant
		const channel = await Channel.findOne({ _id: channelId, type: "dm", participants: thisUser.id });
		if (!channel) {
			set.status = 404;
			return { error: "DM Channel not found or access denied" };
		}

		return { success: true, channel };
	})

	// Post a DM message
	.post("/@dm/:channelId/message", async ({ params, body, user, set }) => {
		const { channelId } = params as { channelId: string };
		const { content } = body as { content: string };

		const thisUser = await Validate.tryGetUser(user, set)
		if ('error' in thisUser) return thisUser;
		
		// Validate the DM channel exists and the user is a participant
		const channel = await Channel.findOne({ _id: channelId, type: "dm", participants: thisUser.id });
		if (!channel) {
			set.status = 404;
			return { error: "DM Channel not found or access denied" };
		}

		// Integrate with your MessageService to handle DM messages.
		// For now, we'll return a mock response.
		return { success: true, message: "DM sent (mock response)" };
	}, {
		body: t.Object({ content: t.String() })
	})
	// ----- Server Channel Routes -----
	// Get details of a server channel
	.get("/:serverId/:channelId", async ({ params, user, set }) => {
		log.stamp(log.PathR() + 'Fetching chat channel')
		const { serverId, channelId } = params as { serverId: string; channelId: string };
		return ChatService.fetchOneChannel(serverId, channelId, user, set)
	}, {
		params: t.Object({ serverId: t.String(), channelId: t.String() }),
	})

	// Post a message in a server channel
	.post("/:serverId/:channelId/message", async ({ params, body, user, set }) => {
		const { serverId, channelId } = params as { serverId: string; channelId: string };
		const { content } = body as { content: string };

		// Validate the user is a member of the server
		const thisUser = await Validate.tryGetUser(user, set)
		if ('error' in thisUser) return thisUser;
		const server = await Validate.tryGetServer(serverId, set, { populate: 'channel' })
		if ('error' in server) return server;
		if (!server.members.includes(thisUser.id)) {
			set.status = 403;
			return { error: "Access denied: You are not a member of this server" };
		}

		// Validate the channel exists and is a server channel
		const channel = await Channel.findOne({ _id: channelId, server: serverId, type: "server" });
		if (!channel) {
			set.status = 404;
			return { error: "Channel not found" };
		}

		// Here you would integrate with your MessageService to handle message creation and broadcasting.
		// For now, we'll return a mock response.
		return { success: true, message: "Message sent to server channel (mock response)" };
	}, {
		body: t.Object({ content: t.String() })
	})



export default chatRoutes;
