import { ServerRepository as ServRep } from "../repositories/ServerRepository";
import { ChannelRepository as ChanRep } from "../repositories/ChannelRepository";
import { UserRepository as UserRep } from "../repositories/UserRepository";
import { Validate } from "../utils/Validate";
import * as log from '../utils/log';

export class ChatService {
	static async fetchOneChannel(serverId: string, channelId: string, user: any, set: any) {
		const thisUser = await Validate.tryGetUser(user, set)
		if ('error' in thisUser) return thisUser;
		const server = await Validate.tryGetServer(serverId, set)
		if ('error' in server) return server;

		if (!server.members.map(e => e.toString()).includes(thisUser._id.toString())) {
			//TODO: redirect to /chat/@dm 
			set.status = 403
			return { error: 'You are not a member of this server.' };
		}
		if (!server.channels.map(e => e.toString()).includes(channelId)) {
			//TODO: redirect to /chat/@dm
			set.status = 404
			return { error: 'This server does not contain channel with this ID' };
		}
		const channel = await ChanRep.findChannelById(channelId);
		if (!channel) {
			//TODO: redirect to server's default channel/last viewed channel
			set.status = 404;
			return { error: "Channel not found" };
		}
		log.stamp(log.PathR() + `Found channel: ${log.Raw(channel.name!, 96)} from ${log.Raw(server.name, 96)}`)
		return { success: true, channel };
	}


}