import { Elysia, t } from "elysia";
import Channel from "../models/Channel";
import Server from "../models/Server";
import { authenticate } from "../middleware/auth";
import { server } from "typescript";
import { set } from "mongoose";

interface UserType { //TODO: refractor this shit to ../middleware/auth.ts
	id: any;
}

const channelRoutes = authenticate

	//! Create a channel ------------------
	.post('/server/:serverId/channel', async ({ params, body, user, set }: { params: any; body: any; user: UserType; set: any }) => {
		const { serverId } = params as { serverId: string }
		const { name } = body as { name: string } // Name for the channel

		//* Find server for channel
		const server = await Server.findById(serverId)
		if (!server) {
			set.status = 404;
			return { error: 'Server not found' }
		}

		//* Owner can create
		if (server.owner.toString() !== user.id) {
			set.status = 403
			return { error: 'Only owner can create channel' } //TODO: on roles system creation
		}

		//* Create and link
		const channel = await Channel.create({ name, server: serverId }) //TODO: handle other type of channel - current text only
		await Server.findByIdAndUpdate(serverId, { $push: { channels: channel._id } });
		return { success: true, channel }
	}, {
		body: t.Object({ name: t.String() }),
	})

	//! Fetch all channel on a server ---------------
	.get('/server/:serverId/channels', async ({ params, set }) => {
		const { serverId } = params as { serverId: string }
		const server = await Server.findById(serverId).populate('channels') //todo: learn about .populate
		if (!server) {
			set.status = 404;
			return { error: 'Server not found' }
		}
		return { success: true, channels: server.channels }
	})

	//! Delete a channel -------------
	.delete('/server/:serverId/channel', async ({ params, body, user, set }: { params: any, body: any, user: UserType, set: any }) => {

		const { serverId } = params as { serverId: string }
		const server = await Server.findById(serverId).populate('channels')
		if (!server) {
			set.status = 404;
			return { error: 'Server not found' }
		}

		//* Owner can delete
		if (server.owner.toString() !== user.id) {
			set.status = 403
			return { error: 'Only owner can delete channel' } //TODO: on roles system creation
		}

		const { channelId } = body as { channelId: string };
		const channel = await Channel.findById(channelId);
		if (!channel) {
			set.status = 404;
			return { error: 'Channel not found' }
		}
		//* Remove channel from server
		await Server.findByIdAndUpdate(server._id, { $pull: { channels: channel._id } });
		//* Delete the channel
		await Channel.findByIdAndDelete(channelId);

	}, {
		body: t.Object({ channelId: t.String() }),
	})

export default channelRoutes;