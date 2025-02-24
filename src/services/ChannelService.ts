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
		const channel = await ChanRep.createChannel( name, serverId ) //TODO: handle other type of channel - current text only
		await ServRep.findServersByIdAndUpdate(serverId, { $push: { channels: channel._id } });

		log.stamp(log.PathR() + `Channel ${log.Raw(name, 96)} created at server ${log.Raw(server.name, 96)} `)
		return { success: true, channel}
	}
}