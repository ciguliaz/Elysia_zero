import { ServerRepository as ServRep } from '../repositories/ServerRepository.ts';
import { UserRepository as UserRep } from '../repositories/UserRepository.ts';
import * as log from './log.ts';

export class Validate {
	static async tryGetUser(user: { id: string }, set: any) {
		if (!user) {
			log.stamp(`${log.PathR()} ${log.ErR('Failed getting user')}: ${user}`);
			set.status = 401;
			return { error: "Unauthorized user" };
		}
		const foundUser = await UserRep.findUserById(user.id);
		if (!foundUser) return { error: 'User not found' };
		log.stamp(`${log.PathR()}Requested by ${log.Raw(foundUser.username, 96)}`);
		return foundUser;
	}

	static async tryGetServer(serverId: string, set: any, options: { populate?: string } = {}) {
		if (!/^[0-9a-f]{24}$/.test(serverId)) {
			log.stamp(`${log.PathR()}Invalid server id. ID: ${log.Raw(serverId, 96)}`);
			set.status = 404;
			return { error: 'Invalid server id' };
		}
		let serverQuery = ServRep.findServerById(serverId);
		if (options.populate) serverQuery = serverQuery.populate(options.populate);
		const server = await serverQuery;
		if (!server) {
			log.stamp(`${log.PathR()}Server not found. ID: ${log.Raw(serverId, 96)}`);
			set.status = 404;
			return { error: 'Server not found' };
		}
		return server;
	}
}