import type { FilterQuery } from "mongoose";
import Server from "../models/Server";
import Channel from "../models/Channel";
import User from "../models/User";
export class ChannelRepository {

	static async createChannel(name: string, serverId: string) {
		return await Channel.create({ name, server: serverId })
	}
	static findChannelById(channelId: string) {
		return Channel.findById(channelId);
	}
	static findChannelByIdAndDelete(channelId: string) {
		return Channel.findByIdAndDelete(channelId);
	}

	static findChannelByQuery(query: FilterQuery<typeof Channel.schema.obj>) {
		return Channel.find(query);
	}

	static deleteManyChannel(query: FilterQuery<typeof Channel.schema.obj>) {
		return Channel.deleteMany(query)
	}


}