import mongoose from "mongoose";

const ChannelSchema = new mongoose.Schema({
	name: { type: String},
	server: { type: mongoose.Schema.Types.ObjectId, ref: 'Server' },
	type: { type: String, enum: ['dm', 'text', 'voice', 'announce'], default: 'text' }, // For now, only text channels
	messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }]
}, { timestamps: true });

export default mongoose.model('Channel', ChannelSchema);
