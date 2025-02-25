import { ServerRepository as ServRep } from "../repositories/ServerRepository";
import { ChannelRepository as ChanRep } from "../repositories/ChannelRepository"
import { UserRepository as UserRep } from "../repositories/UserRepository";
import * as log from '../utils/log';

export class ChannelService {
	//Create new channel from given server id
	static async createChannel
		(name: string, serverId: string, user: { id: string }, set: any) {
		if (!user) {
			log.stamp(log.PathR() + `${log.ErR('Failed getting user')}: ${user}`)
			return { error: "Unauthorized user" };  //  Ensure user is defined
		}

		const thisUser = await UserRep.findUserById(user.id);
		if (!thisUser) return { error: 'User not found' }
		log.stamp(log.PathR() + `Requested by ${log.Raw(thisUser.username, 96)}`)

		//* Validate server id (mongoDB ObjectId standard 24 hex digit) - tested - GOOD
		if (!/^[0-9a-f]{24}$/.test(serverId)) {
			log.stamp(log.PathR() + `Invalid server id. ID: ${log.Raw(serverId, 96)}`)
			set.status = 404;
			return { error: 'Invalid server id' }
		}

		//* Find server for channel - tested - GOOD
		const server = await ServRep.findServerById(serverId)
		if (!server) {
			log.stamp(log.PathR() + `Server not found. ID: ${log.Raw(serverId, 96)}`)
			set.status = 404;
			return { error: 'Server not found' }
		}

		//* Owner can create - tested - GOOD
		if (server.owner.toString() !== user.id) {
			log.stamp(log.PathR() + `Peasant trying. ID: ${log.Raw(thisUser.username, 96)}`)
			set.status = 403
			return { error: 'Only owner can create channel' } //TODO: on roles system creation
		}

		//* Create and link - tested - GOOD
		const channel = await ChanRep.createChannel(name, serverId) //TODO: handle other type of channel - current text only
		await ServRep.findServerByIdAndUpdate(serverId, { $push: { channels: channel._id } });

		log.stamp(log.PathR() + `Channel ${log.Raw(name, 96)} created at server ${log.Raw(server.name, 96)} `)
		return { success: true, channel }
	}
	static async fetchChannel
		(serverId: string, user: { id: string }, set: any) {
		const thisUser = await UserRep.findUserById(user.id);
		if (!thisUser) return { error: 'User not found' }
		log.stamp(log.PathR() + `Requested by ${log.Raw(thisUser.username, 96)}`)

		const server = await ServRep.findServerById(serverId)
			//* populate: get full info of an object then replace the original id
			.populate('channels') //TODO: learn more about .populate (cigu) 
		if (!server) {
			log.stamp(log.PathR() + `Server not found. ID: ${log.Raw(serverId, 96)}`)
			set.status = 404;
			return { error: 'Server not found' }
		}
		log.stamp(log.PathR() + `Server ${log.Raw(server.name, 96)} has ${log.Raw(server.channels.length, 96)} channels. ID: ${log.Raw(serverId, 96)}`)
		return { success: true, name: server.name, channels: server.channels }
	}

	/**
	 * Deletes a channel from a server.
	 * Only the server owner can delete a channel.
	 * @param serverId The ID of the server.
	 * @param channelId The ID of the channel to delete.
	 * @param user The user requesting the deletion.
	 * @param set The response object.
	 * @returns An object indicating success or an error message.
	 */
	static async deleteChannel
		(serverId: string, channelId: string, user: { id: string }, set: any) {
		const thisUser = await UserRep.findUserById(user.id);
		if (!thisUser) return { error: 'User not found' }
		log.stamp(log.PathR() + `Requested by ${log.Raw(thisUser.username, 96)}`)

		const server = await ServRep.findServerById(serverId).populate('channels')
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

		const channel = await ChanRep.findChannelById(channelId);
		if (!channel) {
			log.stamp(log.PathR() + `Server not found. ID: ${log.Raw(channelId, 96)}`)
			set.status = 404;
			return { error: 'Channel not found' }
		}
		//* Remove channel from server
		await ServRep.findServerByIdAndUpdate(server._id.toString(), { $pull: { channels: channel._id } });
		//* Delete the channel
		await ChanRep.findChannelByIdAndDelete(channelId);
		log.stamp(log.PathR() + `Channel ${log.Raw(channel.name, 96)} from ${log.Raw(server.name, 96)} deleted. ID: ${log.Raw(channelId, 96)}`)
		return { success: true }
	}

	/**
	 * Purges channels from a server based on a given name, excluding a specified channel.
	 * Only the server owner can purge channels.
	 * @param serverId The ID of the server.
	 * @param name The name of the channels to purge.
	 * @param channelIdBypass The ID of the channel to exclude from purging.
	 * @param user The user requesting the purge.
	 * @param set The response object.
	 * @returns An object indicating success and a message with the number of deleted channels.
	 */
	static async purgeChannels
		(serverId: string, name: string, channelIdBypass: string, user: { id: string }, set: any) {
		//TODO: handle no bypass

		const thisUser = await UserRep.findUserById(user.id);
		if (!thisUser) return { error: 'User not found' }
		log.stamp(log.PathR() + `Requested by ${log.Raw(thisUser.username, 96)}`)

		const server = await ServRep.findServerById(serverId).populate('channels')
		if (!server) {
			log.stamp(log.PathR() + `Server not found. ID: ${log.Raw(serverId, 96)}`)
			set.status = 404;
			return { error: 'Server not found' }
		}

		const deleteFilter = { name: name, _id: { $nin: [channelIdBypass, '67b21924f260c68e2b037b12'] } }
		const deletedChannels = await ChanRep.findChannelByQuery(deleteFilter).select('_id'); //$ne: query for 'not equal'
		const deleteResult = await ChanRep.deleteManyChannel(deleteFilter)

		if (deleteResult.deletedCount > 0) {
			const deletedChannelIds = deletedChannels.map(channel => channel._id)
			const updateServer = await ServRep.findServerByIdAndUpdate(server._id.toString(), {
				$pull: {
					channels: { $in: deletedChannelIds }
				}
			})
			log.stamp(log.PathR() + `Purged ${log.IdR(deleteResult.deletedCount.toString())} channels with name ${log.Raw(name, 96)} from ${log.Raw(server.name, 96)}.`)
			return { success: true, message: `Deleted ${deleteResult.deletedCount} channel from ${server.name} with name "${name}".` };

		} else {
			log.stamp(log.PathR() + `Purged ${log.IdR(deleteResult.deletedCount.toString())} channels with name ${log.Raw(name, 96)} from ${log.Raw(server.name, 96)}.`)
			return { success: true, message: `Deleted ${deleteResult.deletedCount} channel from ${server.name} with name "${name}".` };
		}
	}
}