import { Elysia, t } from 'elysia'
import Server from '../models/Server'
import User from '../models/User'
import { authenticate } from '../middleware/auth'


interface UserType {
	id: any;
}


const serverRoutes = authenticate

	//! Create a new server --------------
	.post('/server', async ({ body, user }: { body: any; user: UserType }) => {
		if (!user) return { error: "Unauthorized" };  //  Ensure user is defined
		const { name, description } = body as { name: string; description?: string } //* good

		const server = await Server.create({ name, description, owner: user.id, member: [user.id] })
		await User.findByIdAndUpdate(user.id, { $push: { servers: server._id } })
		return { success: true, server }
	}, {
		body: t.Object({ name: t.String(), description: t.Optional(t.String()) })
	})

	//! Join -----------------
	.post('/server/join', async ({ body, user }: { body: any; user: UserType }) => {
		const { serverId } = body as { serverId: string }
		const server = await Server.findById(serverId)
		if (!server) return { error: 'Server not found' }

		// Add
		if (!server.members.includes(user.id)) {
			// Update both schema
			await Server.findByIdAndUpdate(serverId, { $push: { members: user.id } });
			await User.findByIdAndUpdate(user.id, { $push: { servers: server._id } });
			return { success: true, message: "Joined the server" };
		} else {
			return { success: false, message: "Already in the server" };
		}

	}, {
		body: t.Object({ serverId: t.String() })
	})

	//! Leave -------------------
	.post("/server/leave", async ({ body, user }: { body: any; user: UserType }) => {
		const { serverId } = body as { serverId: string };

		const server = await Server.findById(serverId);
		if (!server) return { error: "Server not found" };

		// Remove user from the server
		await Server.findByIdAndUpdate(serverId, { $pull: { members: user.id } });
		await User.findByIdAndUpdate(user.id, { $pull: { servers: serverId } });

		return { success: true, message: "Left the server" };
	}, {
		body: t.Object({ serverId: t.String() })
	})

	//! Get server this user is part of --------------
	.get('/servers', async ({ user }: { user: UserType }) => {
		const servers = await Server.find({ member: user.id })
		return { success: true, servers }
	});

export default serverRoutes