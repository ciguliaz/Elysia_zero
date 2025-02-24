import { Elysia, t } from "elysia";
import { authenticate } from "../middleware/auth";
import Channel from "../models/Channel";
import Server from "../models/Server";
import User from "../models/User";
import { ChannelService } from "../services/ChannelService";
import * as log from '../utils/log'


interface UserType { //TODO: refractor this shit to ../middleware/auth.ts
	id: any;
}

const channelRoutes = new Elysia().use(authenticate) //TODO: clean up (0 times)

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
		async (
			{ query, body, user, set }: { query: { serverId: string }, body: any; user: UserType; set: any } // use query instead, GET does NOT accept body
		) => {
			log.stamp(log.PathR() + 'Fetching Channels')
			// const { serverId } = params as { serverId: string }

			const thisUser = await User.findById(user.id);
			if (!thisUser) return { error: 'User not found' }
			log.stamp(log.PathR() + `Requested by ${log.Raw(thisUser.username, 96)}`)

			const { serverId } = query
			const server = await Server.findById(serverId)
				//* populate: get full info of an object then replace the original id
				.populate('channels') //TODO: learn more about .populate (cigu) 
			if (!server) {
				log.stamp(log.PathR() + `Server not found. ID: ${log.Raw(serverId, 96)}`)
				set.status = 404;
				return { error: 'Server not found' }
			}
			log.stamp(log.PathR() + `Server ${log.Raw(server.name, 96)} has ${log.Raw(server.channels.length, 96)} channels. ID: ${log.Raw(serverId, 96)}`)
			return { success: true, name: server.name, channels: server.channels }
		}, {
		// body: t.Object({ serverId: t.String() }),
		query: t.Object({ serverId: t.String() }),
	})

	//! Delete a channel -------------
	.delete('/server/channel', //* Tested - GOOD
		async ({ body, user, set }: { body: any, user: UserType, set: any }) => {
			log.stamp(log.PathR() + 'Deleting Channel')

			const { serverId } = body as { serverId: string }
			const thisUser = await User.findById(user.id);
			if (!thisUser) return { error: 'User not found' }
			log.stamp(log.PathR() + `Requested by ${log.Raw(thisUser.username, 96)}`)

			const server = await Server.findById(serverId).populate('channels')
			if (!server) {
				log.stamp(log.PathR() + `Server not found. ID: ${log.Raw(serverId, 96)}`)
				set.status = 404;
				return { error: 'Server not found' }
			}

			//* Owner can delete
			if (server.owner.toString() !== user.id) {
				log.stamp(log.PathR() + `Peasant trying. ID: ${log.Raw(thisUser.username, 96)}`)
				set.status = 403
				return { error: 'Only owner can delete channel' } //TODO: on roles system creation
			}

			const { channelId } = body as { channelId: string };
			const channel = await Channel.findById(channelId);
			if (!channel) {
				log.stamp(log.PathR() + `Server not found. ID: ${log.Raw(channelId, 96)}`)
				set.status = 404;
				return { error: 'Channel not found' }
			}
			//* Remove channel from server
			await Server.findByIdAndUpdate(server._id, { $pull: { channels: channel._id } });
			//* Delete the channel
			await Channel.findByIdAndDelete(channelId);
			log.stamp(log.PathR() + `Channel ${log.Raw(channel.name, 96)} from ${log.Raw(server.name, 96)} deleted. ID: ${log.Raw(channelId, 96)}`)
		}, {
		body: t.Object({ serverId: t.String(), channelId: t.String() }),
	})

	//! VERY CAREFUL WHEN RUN THIS
	//! Purge channels -------------
	.delete('/server/channels/purge', //* Tested - GOOD
		async ({ body, user, set }: { body: any, user: UserType, set: any }) => {
			log.stamp(log.PathR() + 'Purging Channels ')

			const { serverId } = body as { serverId: string }
			const thisUser = await User.findById(user.id);
			if (!thisUser) return { error: 'User not found' }
			log.stamp(log.PathR() + `Requested by ${log.Raw(thisUser.username, 96)}`)

			const server = await Server.findById(serverId).populate('channels')
			if (!server) {
				log.stamp(log.PathR() + `Server not found. ID: ${log.Raw(serverId, 96)}`)
				set.status = 404;
				return { error: 'Server not found' }
			}

			const { name, channelIdBypass } = body as { name: string, channelIdBypass: string }
			const deletedChannels = await Channel.find({ name: name, _id: { $nin: [channelIdBypass, '67b21924f260c68e2b037b12'] } }).select('_id'); //$ne: query for 'not equal'
			const deleteResult = await Channel.deleteMany({ name: name, _id: { $nin: [channelIdBypass, '67b21924f260c68e2b037b12'] } })

			if (deleteResult.deletedCount > 0) {
				const deletedChannelIds = deletedChannels.map(channel => channel._id)
				const updateServer = await Server.findByIdAndUpdate(server._id, {
					$pull: {
						channels: { $in: deletedChannelIds }
					}
				})
				log.stamp(log.PathR() + `Purged ${log.IdR(deleteResult.deletedCount.toString())} channels with name ${log.Raw(name, 96)} from ${log.Raw(server.name, 96)}`)
				return { success: true, message: `Deleted ${deleteResult.deletedCount} channel from ${server.name} with name "${name}".` };

			} else {
				log.stamp(log.PathR() + `Purged ${log.IdR(deleteResult.deletedCount.toString())} channels with name ${log.Raw(name, 96)} from ${log.Raw(server.name, 96)}`)
				return { success: true, message: `Deleted ${deleteResult.deletedCount} channel from ${server.name} with name "${name}".` };
			}
		}, {
		body: t.Object({ serverId: t.String(), channelIdBypass: t.String(), name: t.String() }),
	})

export default channelRoutes;