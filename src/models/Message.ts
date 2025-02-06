import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
	sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
	content: { type: String, required: true },
	seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Optional: Read receipts
}, { timestamps: true });

export default mongoose.model('Message', MessageSchema);
