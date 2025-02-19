import { Elysia, t } from 'elysia';
import { authenticate } from '../middleware/auth';
import { ServerService } from '../services/ServerService';
import Server from '../models/Server';
import User from '../models/User';

import * as log from '../utils/log';
import type { ObjectId } from 'mongoose';

interface UserType {
	id: string;
}

const serverRoutes =
	new Elysia().use(authenticate)

		//! Create a new server --------------
		.post('/server', async ({ body, user }: { body: any; user: UserType }) => {  //* Tested - GOOD
			log.stamp(log.PathR() + 'Creating Server')
			const { name, description } = body as { name: string; description?: string }
			return await ServerService.createServer(name, description, user)
		}, {
			body: t.Object({ name: t.String(), description: t.Optional(t.String()) })
		})

		//! Join -----------------
		.post('/server/join', async ({ body, user }: { body: any; user: UserType }) => {   //* Tested - GOOD
			log.stamp(log.PathR() + 'Joining Server')
			const { serverId } = body as { serverId: string }

			const server = await Server.findById(serverId)
			if (!server) return { error: 'Server not found' }
			const thisUser = await User.findById(user.id);
			if (!thisUser) return { error: 'User not found' }

			// Add
			if (!server.members.map(e => e.toString()).includes(user.id.toString())) {
				// Update both schema
				await Server.findByIdAndUpdate(serverId, { $push: { members: user.id } });
				await User.findByIdAndUpdate(user.id, { $push: { servers: server._id } });

				log.stamp(log.PathR() + `${log.Raw(thisUser.username, 96)} Joined Server ${log.Raw(server.name, 96)} `)
				return { success: true, message: "Joined the server" };
			} else {
				log.stamp(log.PathR() + `${log.Raw(thisUser.username, 96)} Is Already In The Server ${log.Raw(server.name, 96)} `)
				return { success: false, message: "Already in the server" };
			}
		}, {
			body: t.Object({ serverId: t.String() })
		})

		//! Leave -------------------
		.post("/server/leave", async ({ body, user }: { body: any; user: UserType }) => {   //* Tested - GOOD
			log.stamp(log.PathR() + 'Leaving Server')
			const { serverId } = body as { serverId: string };

			const server = await Server.findById(serverId)
			if (!server) return { error: 'Server not found' }
			const thisUser = await User.findById(user.id);
			if (!thisUser) return { error: 'User not found' }

			// Remove
			if (server.members.map(e => e.toString()).includes(user.id.toString())) {
				// Update both schema
				await Server.findByIdAndUpdate(serverId, { $pull: { members: user.id } });
				await User.findByIdAndUpdate(user.id, { $pull: { servers: server._id } });

				log.stamp(log.PathR() + `${log.Raw(thisUser.username, 96)} Left The Server ${log.Raw(server.name, 96)} `)
				return { success: true, message: "Left the server" };
			} else {
				log.stamp(log.PathR() + `${log.Raw(thisUser.username, 96)} Is Not In The Server ${log.Raw(server.name, 96)} `)
				return { success: false, message: "Not in the server" };
			}
		}, {
			body: t.Object({ serverId: t.String() })
		})

		//! Get server this user is part of --------------
		.get('/servers', async ({ user }: { user: UserType }) => {  //* Tested - GOOD
			log.stamp(log.PathR() + 'Getting Servers list')
			const thisUser = await User.findById(user.id);
			if (!thisUser) return { error: "User not found" }
			log.stamp(log.PathR() + `Requested by ${log.Raw(thisUser.username, 96)}`)

			const servers = await Server.find({ members: user.id.toString() })
			console.log(servers)
			return { success: true, servers }
		})

		//! VERY CAREFUL WHEN RUN THIS
		//! Purge server of specific name
		.delete('/servers/purge', async ({ body, set }) => { //* Tested - GOOD
			log.stamp(log.PathR() + `Purging Servers`)
			const { name } = body as { name: string };

			const deletedServers = await Server.find({ name: name, _id: { $ne: '67a73b63d2d136bf2dc05a47' } }).select('_id'); //$ne: query for 'not equal'

			const deleteResult = await Server.deleteMany({ name: name, _id: { $ne: '67a73b63d2d136bf2dc05a47' } })
			// log.stamp(log.PathR() + `Purged ${ log.IdR(deleteResult.deletedCount.toString()) } Servers`)

			if (deleteResult.deletedCount > 0) {
				const deletedServerIds = deletedServers.map(server => server._id);
				const updatedUser = await User.updateMany(
					{ servers: { $in: deletedServerIds } },  // Find users who have these servers
					{ $pull: { servers: { $in: deletedServerIds } } }  // Remove them from the `servers` field
				);
				log.stamp(log.PathR() + `Purged ${log.IdR(deleteResult.deletedCount.toString())} Servers; Updated ${log.IdR(updatedUser.modifiedCount.toString())} Users`)
				return { success: true, message: `Deleted ${deleteResult.deletedCount} servers with name "${name}".` };
			} else {
				log.stamp(log.PathR() + `Purged ${log.IdR(deleteResult.deletedCount.toString())} Servers`)
				set.status = 404;
				return { success: true, message: `No servers found with name "${name}".` };
			}
		});

export default serverRoutes