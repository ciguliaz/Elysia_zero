import { Elysia, t } from 'elysia';
import { authenticate } from '../middleware/auth';
import { ServerService } from '../services/ServerService';
import Server from '../models/Server';
import User from '../models/User';
import * as log from '../utils/log';

interface UserType {
	id: string;
}

const serverRoutes =
	new Elysia().use(authenticate)

		//* Create a new server --------------
		.post('/server', async ({ body, user }: { body: any; user: UserType }) => {  //* Tested - GOOD
			log.stamp(log.PathR() + 'Creating Server')
			const { name, description } = body as { name: string; description?: string }
			return await ServerService.createServer(name, description, user)
		}, {
			body: t.Object({ name: t.String(), description: t.Optional(t.String()) })
		})

		//* Join -----------------
		.post('/server/join', async ({ body, user }: { body: any; user: UserType }) => {   //* Tested - GOOD
			log.stamp(log.PathR() + 'Joining Server')
			const { serverId } = body as { serverId: string }
			return await ServerService.joinServer(serverId, user)
		}, {
			body: t.Object({ serverId: t.String() })
		})

		//* Leave -------------------
		.post("/server/leave", async ({ body, user }: { body: any; user: UserType }) => {   //* Tested - GOOD
			log.stamp(log.PathR() + 'Leaving Server')
			const { serverId } = body as { serverId: string };
			return await ServerService.leaveServer(serverId, user)
		}, {
			body: t.Object({ serverId: t.String() })
		})

		//* Get servers this user is part of --------------
		.get('/servers', async ({ user }: { user: UserType }) => {  //* Tested - GOOD
			log.stamp(log.PathR() + 'Getting Servers list')
			return await ServerService.fetchServersOfUser(user)
		})

		//! VERY CAREFUL WHEN RUN THIS
		//! Purge server of specific name
		.delete('/servers/purge', async ({ body, set }) => { //* Tested - GOOD
			log.stamp(log.PathR() + `Purging Servers`)
			const { name } = body as { name: string };

			const deletedServers = await Server.find({ name: name, _id: { $ne: '67a73b63d2d136bf2dc05a47' } }).select('_id'); //$ne: query for 'not equal'
			const deleteResult = await Server.deleteMany({ name: name, _id: { $ne: '67a73b63d2d136bf2dc05a47' } })

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