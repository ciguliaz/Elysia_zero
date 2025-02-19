import { ServerRepository } from "../repositories/ServerRepository";
import * as log from '../utils/log';

export class ServerService {
	//! Create a new server
	/**
	 * Creates a new server.
	 * This function creates a new server with the given name, description, and owner.
	 * @param name The name of the server.
	 * @param description The description of the server.
	 * @param user The user creating the server.
	 * @returns The newly created server, or an error object if the user is not authorized.
	 */
	static async createServer //* tested
		(name: string, description: string | null | undefined, user: { id: string }) {

		if (!user) {
			log.stamp(log.PathR() + `${log.ErR('Failed getting user')}: ${user}`)
			return { error: "Unauthorized user" };  //  Ensure user is defined
		}

		const server = await ServerRepository.createServer(name, description || '', user.id)
		if ('error' in server) {
			log.stamp(log.PathR() + `Server Creating Failed with error ${log.ErR(server.error)} \n`)
			return { success: false, error: server.error }
		}
		log.stamp(log.PathR() + `Server Created: ${log.Raw(name, 96)} \n`)
		return { success: true, server: server }
	}

	// User joins a server
	static async joinServer(serverId: string, userId: string) {
		const server = await ServerRepository.findServerById(serverId);
		if (!server) return { error: "Server not found" };

		if (!server.members.map(toString).includes(userId)) {
			await ServerRepository.addUserToServer(serverId, userId);
			return { success: true, message: "Joined the server" };
		}
		return { success: false, message: "Already in the server" };
	}

	// User leaves a server
	static async leaveServer(serverId: string, userId: string) {
		const server = await ServerRepository.findServerById(serverId);
		if (!server) return { error: "Server not found" };

		await ServerRepository.removeUserFromServer(serverId, userId);
		return { success: true, message: "Left the server" };
	}
}
