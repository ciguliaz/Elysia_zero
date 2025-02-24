import type { FilterQuery } from "mongoose";
import Server from "../models/Server";
import Channel from "../models/Channel";
import User from "../models/User";
export class ChannelRepository {
	
	static async createChannel(name: string, serverId: string) {
		return await Channel.create({ name, server: serverId })
	}


}