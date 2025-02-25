import { Elysia, t } from 'elysia';
import { authenticate } from '../middleware/auth';
import { ServerService } from '../services/ServerService';
import * as log from '../utils/log';

interface UserType {
	id: string;
}

const serverRoutes =
	new Elysia().use(authenticate)

		//* Create a new server --------------
		.post('/server', async ({ body, user, set }: { body: any; user: UserType, set: any }) => {  //* Tested - GOOD
			log.stamp(log.PathR() + 'Creating Server')
			const { name, description } = body as { name: string; description?: string }
			return await ServerService.createServer(name, description, user, set)
		}, {
			body: t.Object({ name: t.String(), description: t.Optional(t.String()) })
		})

		//* Join -----------------
		.post('/server/join', async ({ body, user, set }: { body: any; user: UserType, set: any }) => {   //* Tested - GOOD
			log.stamp(log.PathR() + 'Joining Server')
			const { serverId } = body as { serverId: string }
			return await ServerService.joinServer(serverId, user, set)
		}, {
			body: t.Object({ serverId: t.String() })
		})

		//* Leave -------------------
		.post("/server/leave", async ({ body, user, set }: { body: any; user: UserType, set: any }) => {   //* Tested - GOOD
			log.stamp(log.PathR() + 'Leaving Server')
			const { serverId } = body as { serverId: string };
			return await ServerService.leaveServer(serverId, user, set)
		}, {
			body: t.Object({ serverId: t.String() })
		})

		//* Get servers this user is part of --------------
		.get('/servers', async ({ user, set }: { user: UserType; set: any }) => {  //* Tested - GOOD
			log.stamp(log.PathR() + 'Getting Servers list')
			return await ServerService.fetchServersOfUser(user, set)
		})

		//! VERY CAREFUL WHEN RUN THIS
		//! Purge server of specific name
		.delete('/servers/purge', async ({ body, set }) => { //* tested
			log.stamp(log.PathR() + `Purging Servers`)
			const { name } = body;
			return await ServerService.purgeServers(name, set)
		}, {
			body: t.Object({ name: t.String() })
		});

export default serverRoutes