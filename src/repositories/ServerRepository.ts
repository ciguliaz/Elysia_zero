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
			return { error: 'Server name cannot be empty or contain only whitespace.' }
		}
		if (!ownerId || ownerId.trim() === '') {
			return { error: 'Owner ID cannot be empty or contain only whitespace.' }
		}
		return await Server.create({ name, description, owner: ownerId, member: [ownerId] })
	}

	static async findServerById(serverId: string) {
		return await Server.findById(serverId);
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