import type { FilterQuery } from "mongoose";
import Server from "../models/Server";
import User from "../models/User";

export class UserRepository {

	static async createUser(name: string, hashedPassword: string) {
		return await User.create({ username: name, password: hashedPassword })
	}
	static async findUserById(userId: string) {
		return await User.findById(userId);
	}
	static async findUserByServerId(serverId: string) {
		return await User.find({ servers: serverId })
	}
	static async findUsersByQuery(query: FilterQuery<typeof User.schema.obj>) {
		return await User.find(query);
	}
}


