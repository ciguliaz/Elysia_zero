import { ServerRepository as ServRep } from "../repositories/ServerRepository";
import { UserRepository as UserRep } from "../repositories/UserRepository";
import { Validate } from "../utils/Validate";
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
		(name: string, description: string | null | undefined, user: { id: string }, set: any) {
		const thisUser = await Validate.tryGetUser(user, set)
		if ('error' in thisUser) return thisUser;

		const server = await ServRep.createServer(name, description || '', user.id)
		if ('error' in server) {
			log.stamp(log.PathR() + `Server Creating Failed with error ${log.ErR(server.error)} \n`)
			set.status = 418 //Tea pot
			return { success: false, error: server.error }
		}
		log.stamp(log.PathR() + `Server Created: ${log.Raw(name, 96)} \n`)
		return { success: true, server: server }
	}

	//! User joins a server
	/**
	 * Adds a user to a server.
	 * This function adds a user to a server, if they are not already a member.
	 * @param serverId The ID of the server.
	 * @param user The user to add to the server.
	 * @returns An object indicating success or failure, with a message.
	 */
	static async joinServer //* tested
		(serverId: string, user: { id: string }, set: any) {
		const thisUser = await Validate.tryGetUser(user, set)
		if ('error' in thisUser) return thisUser;
		const server = await Validate.tryGetServer(serverId, set, { populate: 'channel' })
		if ('error' in server) return server;

		if (!server.members.map(e => e.toString()).includes(user.id)) {
			await ServRep.addUserToServer(serverId, user.id);
			log.stamp(log.PathR() + `${log.Raw(thisUser.username, 96)} Joined Server ${log.Raw(server.name, 96)} `)
			return { success: true, message: "Joined the server" };
		}
		log.stamp(log.PathR() + `${log.Raw(thisUser.username, 96)} Is Already In The Server ${log.Raw(server.name, 96)} `)
		set.status = 418
		return { success: false, message: "Already in the server" };
	}

	//! User leaves a server
	/**
	 * Removes a user from a server.
	 * This function removes a user from a server, if they are currently a member.
	 * @param serverId The ID of the server.
	 * @param user The user to remove from the server.
	 * @returns An object indicating success or failure, with a message.
	 */
	static async leaveServer //* tested
		(serverId: string, user: { id: string }, set: any) {
		const thisUser = await Validate.tryGetUser(user, set)
		if ('error' in thisUser) return thisUser;
		const server = await Validate.tryGetServer(serverId, set, { populate: 'channel' })
		if ('error' in server) return server;

		if (server.members.map(e => e.toString()).includes(user.id)) {
			await ServRep.removeUserFromServer(serverId, user.id);
			log.stamp(log.PathR() + `${log.Raw(thisUser.username, 96)} Left Server ${log.Raw(server.name, 96)} `)
			return { success: true, message: "Left the server" };
		}
		log.stamp(log.PathR() + `${log.Raw(thisUser.username, 96)} Is Already not In The Server ${log.Raw(server.name, 96)} `)
		set.status = 418
		return { success: false, message: "Already not in the server" };
	}

	/**
	 * Fetches the servers a user is a member of.
	 * This function retrieves all servers associated with a given user ID.
	 * @param user The user whose servers are to be fetched.
	 * @returns An object containing the servers or an error message if the user is not found.
	 */
	static async fetchServersOfUser //* tested
		(user: { id: string }, set: any) {
		const thisUser = await Validate.tryGetUser(user, set)
		if ('error' in thisUser) return thisUser;
		log.stamp(log.PathR() + `Fetching servers of ${log.Raw(thisUser.username, 96)}`)

		const servers = await ServRep.findServersByUserId(user.id)
		log.stamp(log.PathR() + `${log.Raw(thisUser.username, 96)} is currently in ${log.IdR(servers.length)} Servers`)

		console.log(servers)
		return { success: true, servers: servers }
	}
	static async purgeServers //* tested
		(name: string, set: any) {

		const deleteFilter = { name: name, _id: { $ne: '67a73b63d2d136bf2dc05a47' } } //$ne: query for 'not equal'
		const deletedServers = await ServRep.findServersByQuery(deleteFilter).select('_id');
		const deleteResult = await ServRep.deleteManyServer(deleteFilter)
		const curLog = log.PathR() + `Purged ${log.IdR(deleteResult.deletedCount.toString())} Servers`

		if (deleteResult.deletedCount > 0) {
			const deletedServerIds = deletedServers.map(server => server._id);
			const updatedUser = await UserRep.updateManyUser(
				{ servers: { $in: deletedServerIds } },  // Find users who have these servers
				{ $pull: { servers: { $in: deletedServerIds } } }  // Remove them from the `servers` field
			);
			log.stamp(curLog + `; Updated ${log.IdR(updatedUser.modifiedCount.toString())} Users`)
			return { success: true, message: `Deleted ${deleteResult.deletedCount} servers with name "${name}".` };
		} else {
			log.stamp(curLog)
			set.status = 404;
			return { success: true, message: `No servers found with name "${name}".` };
		}

	}
}