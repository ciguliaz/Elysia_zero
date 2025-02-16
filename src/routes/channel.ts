import { Elysia, t } from "elysia";
import { authenticate } from "../middleware/auth";
import Channel from "../models/Channel";
import Server from "../models/Server";
import User from "../models/User";

import * as log from '../utils/log'


interface UserType { //TODO: refractor this shit to ../middleware/auth.ts
	id: any;
}

const channelRoutes =
	// authenticate
	new Elysia().use(authenticate)

		//! Create a channel ------------------
		.post('/server/channel', async ({ body, user, set }: { body: any; user: UserType; set: any }) => {
			log.stamp(log.PathR() + 'Creating Channel')

			// const { serverId } = params as { serverId: string }
			const { name, serverId } = body // Name for the channel

			const thisUser = await User.findById(user.id);
			if (!thisUser) return { error: 'User not found' }
			log.stamp(log.PathR() + `Requested by ${log.Raw(thisUser.username, 96)}`)

			//* Validate server id (mongoDB ObjectId standard 24 hex digit) - tested - GOOD
			if (!/^[0-9a-f]{24}$/.test(serverId)) {
				log.stamp(log.PathR() + `Invalid server id. ID: ${log.Raw(serverId, 96)}`)
				set.status = 404;
				return { error: 'Invalid server id' }
			}

			//* Find server for channel - tested - GOOD
			const server = await Server.findById(serverId)
			if (!server) {
				log.stamp(log.PathR() + `Server not found. ID: ${log.Raw(serverId, 96)}`)
				set.status = 404;
				return { error: 'Server not found' }
			}

			//* Owner can create - tested - GOOD
			if (server.owner.toString() !== user.id) {
				log.stamp(log.PathR() + `Peasant testing. ID: ${log.Raw(thisUser.username, 96)}`)
				set.status = 403
				return { error: 'Only owner can create channel' } //TODO: on roles system creation
			}

			//* Create and link - tested - GOOD
			const channel = await Channel.create({ name, server: serverId }) //TODO: handle other type of channel - current text only
			await Server.findByIdAndUpdate(serverId, { $push: { channels: channel._id } });
			log.stamp(log.PathR() + `Channel ${log.Raw(name, 96)} created at server ${log.Raw(server.name, 96)} `)
			return { success: true, channel }
		}, {
			body: t.Object({ name: t.String(), serverId: t.String() }),
		})

		//! Fetch all channel on a server ---------------
		.get('/server/channels', async ({ body, set }) => {
			log.stamp(log.PathR() + 'Fetching Channels')

			// const { serverId } = params as { serverId: string }
			const { serverId } = body as { serverId: string }

			const server = await Server.findById(serverId).populate('channels') //TODO: learn about .populate
			if (!server) {
				set.status = 404;
				return { error: 'Server not found' }
			}
			return { success: true, channels: server.channels }
		})

		//! Delete a channel -------------
		.delete('/server/channel', async ({ body, user, set }: { body: any, user: UserType, set: any }) => {
			log.stamp(log.PathR() + 'Deleting Channel')

			const { serverId } = body as { serverId: string }

			const server = await Server.findById(serverId).populate('channels')
			if (!server) {
				set.status = 404;
				return { error: 'Server not found' }
			}

			//* Owner can delete
			if (server.owner.toString() !== user.id) {
				set.status = 403
				return { error: 'Only owner can delete channel' } //TODO: on roles system creation
			}

			const { channelId } = body as { channelId: string };
			const channel = await Channel.findById(channelId);
			if (!channel) {
				set.status = 404;
				return { error: 'Channel not found' }
			}
			//* Remove channel from server
			await Server.findByIdAndUpdate(server._id, { $pull: { channels: channel._id } });
			//* Delete the channel
			await Channel.findByIdAndDelete(channelId);

		}, {
			body: t.Object({ channelId: t.String() }),
		})

// .post('/test', () => {
// 	console.log('testing')
// 	return { success: true }
// })

export default channelRoutes;