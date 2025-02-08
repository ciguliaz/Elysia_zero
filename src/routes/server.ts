import { Elysia, t } from 'elysia';
import { authenticate } from '../middleware/auth';
import Server from '../models/Server';
import User from '../models/User';

import * as log from '../utils/log';

interface UserType {
	id: any;
}

const serverRoutes =
	// authenticate
	new Elysia().use(authenticate)

		//! Create a new server --------------
		.post('/server', async ({ body, user }: { body: any; user: UserType }) => {  //* Tested - GOOD

			log.stamp(log.PathR() + 'Creating Server')

			if (!user) {
				log.stamp(log.PathR() + `${log.ErR('Failed getting user')}: ${user}`)
				return { error: "Unauthorized post/server" };  //  Ensure user is defined
			}
			const { name, description } = body as { name: string; description?: string }

			const server = await Server.create({ name, description, owner: user.id, member: [user.id] })
			await User.findByIdAndUpdate(user.id, { $push: { servers: server._id } })
			log.stamp(log.PathR() + `Server Created: ${log.Raw(name, 96)} \n`)
			return { success: true, server }
		}, {
			body: t.Object({ name: t.String(), description: t.Optional(t.String()) })
		})

		//! Join -----------------
		.post('/server/join', async ({ body, user }: { body: any; user: UserType }) => {   //* Tested - GOOD
			log.stamp(log.PathR() + 'Joining Server')
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
		.post("/server/leave", async ({ body, user }: { body: any; user: UserType }) => {   //* Tested - GOOD
			log.stamp(log.PathR() + 'Leaving Server')

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
			log.stamp(log.PathR() + 'Getting Servers list')

			const servers = await Server.find({ member: user.id })
			console.log(servers)
			return { success: true, servers }
		})

		//! VERY CAREFUL WHEN RUN THIS
		//! Purge server of specific name
		.delete('/servers/purge', async ({ body, set }) => { //* Tested - GOOD
			log.stamp(log.PathR() + `Purging Servers`)
			const { name } = body as { name: string };
			const result = await Server.deleteMany({ name: name, _id: { $ne: '67a63d62a32648fa87fd17f2' } });
			log.stamp(log.PathR() + `Purged ${log.IdR(result.deletedCount.toString())} Servers`)

			if (result.deletedCount > 0) {
				return { success: true, message: `Deleted ${result.deletedCount} servers with name "${name}".` };
			} else {
				set.status = 404;
				return { success: false, message: `No servers found with name "${name}".` };
			}
		});

export default serverRoutes