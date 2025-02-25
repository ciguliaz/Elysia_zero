import { Elysia, t } from "elysia";
import { authenticate } from "../middleware/auth";
import { ChannelService } from "../services/ChannelService";
import * as log from '../utils/log';


interface UserType { //TODO: refractor this shit to ../middleware/auth.ts
	id: any;
}

const channelRoutes = new Elysia().use(authenticate) //TODO: clean up (1 times)

	//! Create a channel ------------------
	.post('/server/channel', //* Tested - GOOD
		async ({ body, user, set }: { body: any; user: UserType; set: any }) => {
			log.stamp(log.PathR() + 'Creating Channel')
			const { name, serverId } = body // Name for the channel
			return await ChannelService.createChannel(name, serverId, user, set)
		}, {
		body: t.Object({ name: t.String(), serverId: t.String() }),
	})

	//! Fetch all channel on a server ---------------
	.get('/server/channels', //* Tested - GOOD
		//TODO: might change to /:serverId/channel
		async ({ query, body, user, set }:
			{ query: { serverId: string }, body: any; user: UserType; set: any }) => {// use query instead, GET does NOT accept body
			log.stamp(log.PathR() + 'Fetching Channels')
			const { serverId } = query
			return await ChannelService.fetchChannel(serverId, user, set)
		}, {
		// body: t.Object({ serverId: t.String() }),
		query: t.Object({ serverId: t.String() }),
	})

	//! Delete a channel -------------
	.delete('/server/channel', //* Tested - GOOD
		async ({ body, user, set }: { body: any, user: UserType, set: any }) => {
			log.stamp(log.PathR() + 'Deleting Channel')
			const { serverId, channelId } = body
			return ChannelService.deleteChannel(serverId, channelId, user, set)
		}, {
		body: t.Object({ serverId: t.String(), channelId: t.String() }),
	})

	//! VERY CAREFUL WHEN RUN THIS
	//! Purge channels -------------
	.delete('/server/channels/purge', //* Tested - GOOD
		async ({ body, user, set }: { body: any, user: UserType, set: any }) => {
			log.stamp(log.PathR() + 'Purging Channels ')
			const { serverId, name, channelIdBypass } = body
			return await ChannelService.purgeChannels(serverId, name, channelIdBypass, user, set)
		}, {
		body: t.Object({ serverId: t.String(), channelIdBypass: t.String(), name: t.String() }),
	})

export default channelRoutes;