import type { FilterQuery, UpdateQuery } from "mongoose";
import Server from "../models/Server";
import User from "../models/User";
export class ServerRepository {

	/**
	 * Creates a new server.
	 * This function creates a new server with the given name, description, and owner.
	 *
	 * @param name - The name of the server.
	 * @param description - The description of the server.
	 * @param ownerId - The ID of the owner of the server.
	 * @returns A promise that resolves to the created server, or an error object if input validation fails.
	 */
	static async createServer(name: string, description: string, ownerId: string) {
		if (!name || name.trim() === '') {
			return { error: 'Server name cannot be empty or contain only whitespace.' };
		}
		if (!ownerId || ownerId.trim() === '') {
			return { error: 'Owner ID cannot be empty or contain only whitespace.' };
		}
		return await Server.create({ name, description, owner: ownerId, member: [ownerId] });
	}

	static findServerById(serverId: string) {
		return Server.findById(serverId);
	}

	/**
	 * Finds servers by user ID.
	 * This function retrieves all servers that a given user is a member ```typescript of.
	 * @param userId - The ID of the user to search for.
	 * @returns A promise that resolves to an array of servers.
	 */
	static async findServersByUserId(userId: string) {
		return await Server.find({ members: userId });
	}

	/**
	 * Finds servers based on a given query.
	 * This function retrieves servers that match the provided query.
	 * @param query - The query to use for finding servers.
	 * @returns A promise that resolves to an array of servers matching the query.
	 */
	static async findServersByQuery(query: FilterQuery<typeof Server.schema.obj>) {
		return await Server.find(query);
	}

	static async findServerByIdAndUpdate(serverId: string, update: UpdateQuery<typeof Server.schema.obj>) {
		return await Server.findByIdAndUpdate(serverId, update);
	}

	// Add user to a server
	static async addUserToServer(serverId: string, userId: string) {
		await Server.findByIdAndUpdate(serverId, { $push: { members: userId } });
		await User.findByIdAndUpdate(userId, { $push: { servers: serverId } });
	}
	// Remove user from a server
	static async removeUserFromServer(serverId: string, userId: string) {
		await Server.findByIdAndUpdate(serverId, { $pull: { members: userId } });
		await User.findByIdAndUpdate(userId, { $pull: { servers: serverId } });
	}
}