import mongoose from "mongoose";

const ChannelSchema = new mongoose.Schema({
	name: { type: String, required: true },
	server: { type: mongoose.Schema.Types.ObjectId, ref: 'Server', required: true, index: true },
	type: { type: String, enum: ['text'], default: 'text' } // For now, only text channels
}, { timestamps: true });

export default mongoose.model('Channel', ChannelSchema);
